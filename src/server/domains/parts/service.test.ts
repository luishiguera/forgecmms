import { and, eq, inArray, isNull } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../../db/client";
import {
	organizations,
	parts,
	tagAssignments,
	tags,
	userOrganizations,
} from "../../db/schema";
import { errorCodeOf } from "../../errors";
import type { TenantContext } from "../../tenant";
import * as repository from "./repository";
import * as service from "./service";

let tenant: TenantContext;
let otherTenant: TenantContext;
let tagId: number;
const createdPartIds: number[] = [];

const suffix = process.hrtime.bigint().toString().slice(-9);
let sequence = 0;
const uniqueName = (label: string) =>
	`zz-test-${label}-${suffix}-${++sequence}`;

const codeOfRejection = async (run: () => Promise<unknown>) => {
	try {
		await run();
		return "no-rejection";
	} catch (error) {
		return errorCodeOf(error) ?? "unknown-error";
	}
};

const tenantFor = (organizationId: number, userId: number): TenantContext => ({
	organizationId,
	userId,
	hasBackoffice: true,
	hasField: true,
	isOwner: true,
	timezone: "UTC",
});

beforeAll(async () => {
	const orgs = await db
		.select({ id: organizations.id, ownerId: organizations.ownerId })
		.from(organizations)
		.innerJoin(
			userOrganizations,
			and(
				eq(userOrganizations.organizationId, organizations.id),
				eq(userOrganizations.userId, organizations.ownerId),
				isNull(userOrganizations.deletedAt),
			),
		)
		.limit(2);

	if (orgs.length < 2) {
		throw new Error("these tests need at least two organizations");
	}

	tenant = tenantFor(orgs[0].id, orgs[0].ownerId);
	otherTenant = tenantFor(orgs[1].id, orgs[1].ownerId);

	const [tag] = await db
		.insert(tags)
		.values({
			organizationId: tenant.organizationId,
			tagType: "part",
			name: uniqueName("tag"),
		})
		.returning({ id: tags.id });
	tagId = tag.id;
});

afterAll(async () => {
	if (createdPartIds.length > 0) {
		await db
			.delete(tagAssignments)
			.where(inArray(tagAssignments.entityId, createdPartIds));
		await db.delete(parts).where(inArray(parts.id, createdPartIds));
	}
	if (tagId) await db.delete(tags).where(eq(tags.id, tagId));
});

const createPart = async (overrides: Record<string, unknown> = {}) => {
	const part = await service.create(tenant, {
		sku: "",
		name: uniqueName("part"),
		description: "",
		quantity: 0,
		min_quantity: 0,
		unit_price: 0,
		currency: "",
		unit_of_measure: "",
		image_url: "",
		...overrides,
	} as Parameters<typeof service.create>[1]);
	createdPartIds.push(part.id);
	return part;
};

describe("parts service", () => {
	it("creates a part and returns the hydrated response", async () => {
		const part = await createPart({
			sku: uniqueName("sku"),
			description: "a description",
			quantity: 12,
			min_quantity: 4,
			unit_price: 2599,
			currency: "EUR",
			unit_of_measure: "unit",
			tag_ids: [tagId],
		});

		expect(part.id).toBeGreaterThan(0);
		expect(part.quantity).toBe(12);
		expect(part.min_quantity).toBe(4);
		expect(part.unit_price).toBe(2599);
		expect(part.currency).toBe("EUR");
		expect(part.tags.map((tag) => tag.id)).toEqual([tagId]);
		expect(part.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});

	it("reads back exactly what create returned", async () => {
		const created = await createPart();
		expect(await service.get(tenant, created.id)).toEqual(created);
	});

	it("finds the part by free text search on sku", async () => {
		const created = await createPart({ sku: uniqueName("findable") });
		const result = await service.search(tenant, {
			q: created.sku,
			page: 1,
			size: 20,
		});

		expect(result.total).toBe(1);
		expect(result.items.map((item) => item.id)).toEqual([created.id]);
	});

	const idsForStock = async (stock: "low" | "ok") => {
		const result = await service.search(tenant, {
			q: suffix,
			stock,
			page: 1,
			size: 100,
		});
		return result.items.map((item) => item.id);
	};

	it("separates low stock from ok stock", async () => {
		const low = await createPart({ quantity: 1, min_quantity: 5 });
		const ok = await createPart({ quantity: 9, min_quantity: 5 });

		const lowIds = await idsForStock("low");
		const okIds = await idsForStock("ok");

		expect(lowIds).toContain(low.id);
		expect(lowIds).not.toContain(ok.id);
		expect(okIds).toContain(ok.id);
		expect(okIds).not.toContain(low.id);
	});

	it("counts equal quantity and minimum as ok stock, not low", async () => {
		const equal = await createPart({ quantity: 5, min_quantity: 5 });

		expect(await idsForStock("low")).not.toContain(equal.id);
		expect(await idsForStock("ok")).toContain(equal.id);
	});

	it("applies a partial update and leaves other fields alone", async () => {
		const created = await createPart({ unit_of_measure: "keep-me" });
		const updated = await service.update(tenant, created.id, { quantity: 77 });

		expect(updated.quantity).toBe(77);
		expect(updated.unit_of_measure).toBe("keep-me");
		expect(updated.name).toBe(created.name);
	});

	it("adjusts stock by a delta and allows going negative", async () => {
		const created = await createPart({ quantity: 3 });

		await repository.adjustStock(tenant.organizationId, created.id, -5);
		expect((await service.get(tenant, created.id)).quantity).toBe(-2);

		await repository.adjustStock(tenant.organizationId, created.id, 10);
		expect((await service.get(tenant, created.id)).quantity).toBe(8);
	});

	it("rejects a duplicate sku with a conflict", async () => {
		const sku = uniqueName("dup");
		await createPart({ sku });

		expect(await codeOfRejection(() => createPart({ sku }))).toBe("conflict");
	});

	it("hides parts from another organization", async () => {
		const created = await createPart();
		expect(
			await codeOfRejection(() => service.get(otherTenant, created.id)),
		).toBe("not_found");
	});

	it("soft deletes and then reports not found", async () => {
		const created = await createPart();
		await service.remove(tenant, created.id);

		expect(await codeOfRejection(() => service.get(tenant, created.id))).toBe(
			"not_found",
		);
		expect(
			await codeOfRejection(() => service.remove(tenant, created.id)),
		).toBe("not_found");
	});
});
