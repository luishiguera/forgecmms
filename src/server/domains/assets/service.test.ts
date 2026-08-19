import { and, eq, inArray, isNull } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../../db/client";
import {
	assets,
	organizations,
	tagAssignments,
	tags,
	userOrganizations,
} from "../../db/schema";
import { errorCodeOf } from "../../errors";
import type { TenantContext } from "../../tenant";
import * as service from "./service";

let tenant: TenantContext;
let otherTenant: TenantContext;
let tagId: number;
const createdAssetIds: number[] = [];

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
			tagType: "asset",
			name: uniqueName("tag"),
		})
		.returning({ id: tags.id });
	tagId = tag.id;
});

afterAll(async () => {
	if (createdAssetIds.length > 0) {
		await db
			.delete(tagAssignments)
			.where(inArray(tagAssignments.entityId, createdAssetIds));
		await db.delete(assets).where(inArray(assets.id, createdAssetIds));
	}
	if (tagId) await db.delete(tags).where(eq(tags.id, tagId));
});

const createAsset = async (overrides: Record<string, unknown> = {}) => {
	const asset = await service.create(tenant, {
		name: uniqueName("asset"),
		serial_number: "",
		model: "",
		manufacturer: "",
		description: "",
		status: "operational",
		criticality: "normal",
		image_url: "",
		...overrides,
	} as Parameters<typeof service.create>[1]);
	createdAssetIds.push(asset.id);
	return asset;
};

describe("assets service", () => {
	it("creates an asset and returns the hydrated response", async () => {
		const asset = await createAsset({
			serial_number: uniqueName("sn"),
			model: "M-1",
			manufacturer: "ACME",
			description: "a description",
			criticality: "critical",
			tag_ids: [tagId],
		});

		expect(asset.id).toBeGreaterThan(0);
		expect(asset.status).toBe("operational");
		expect(asset.criticality).toBe("critical");
		expect(asset.assignment_status).toBe("available");
		expect(asset.location).toBeNull();
		expect(asset.parent_asset_id).toBeNull();
		expect(asset.tags.map((tag) => tag.id)).toEqual([tagId]);
		expect(asset.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});

	it("reads back exactly what create returned", async () => {
		const created = await createAsset();
		const fetched = await service.get(tenant, created.id);
		expect(fetched).toEqual(created);
	});

	it("finds the asset by free text search", async () => {
		const created = await createAsset({ manufacturer: uniqueName("maker") });
		const result = await service.search(tenant, {
			q: created.manufacturer,
			page: 1,
			size: 20,
		});

		expect(result.total).toBe(1);
		expect(result.page).toBe(1);
		expect(result.size).toBe(20);
		expect(result.items.map((item) => item.id)).toEqual([created.id]);
	});

	it("filters by tag", async () => {
		const created = await createAsset({ tag_ids: [tagId] });
		const result = await service.search(tenant, {
			tag_id: tagId,
			page: 1,
			size: 20,
		});
		expect(result.items.map((item) => item.id)).toContain(created.id);
	});

	it("applies a partial update and leaves other fields alone", async () => {
		const created = await createAsset({ model: "keep-me" });
		const updated = await service.update(tenant, created.id, {
			name: uniqueName("renamed"),
		});

		expect(updated.name).not.toBe(created.name);
		expect(updated.model).toBe("keep-me");
		expect(updated.id).toBe(created.id);
	});

	it("distinguishes an absent field from an explicit null", async () => {
		const created = await createAsset();

		const untouched = await service.update(tenant, created.id, {
			name: uniqueName("still-no-location"),
		});
		expect(untouched.location_id).toBeNull();

		const cleared = await service.update(tenant, created.id, {
			parent_asset_id: null,
		});
		expect(cleared.parent_asset_id).toBeNull();
	});

	it("rejects a duplicate serial number with a conflict", async () => {
		const serial = uniqueName("dup");
		await createAsset({ serial_number: serial });

		expect(
			await codeOfRejection(() => createAsset({ serial_number: serial })),
		).toBe("conflict");
	});

	it("hides assets from another organization", async () => {
		const created = await createAsset();
		expect(
			await codeOfRejection(() => service.get(otherTenant, created.id)),
		).toBe("not_found");
	});

	it("soft deletes and then reports not found", async () => {
		const created = await createAsset();
		await service.remove(tenant, created.id);

		expect(await codeOfRejection(() => service.get(tenant, created.id))).toBe(
			"not_found",
		);
		expect(
			await codeOfRejection(() => service.remove(tenant, created.id)),
		).toBe("not_found");

		const [row] = await db
			.select({ deletedAt: assets.deletedAt })
			.from(assets)
			.where(eq(assets.id, created.id));
		expect(row.deletedAt).not.toBeNull();
	});
});
