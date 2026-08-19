import { and, eq, inArray, isNull, like } from "drizzle-orm";
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
import { setEntityTags, tagsForEntities } from "./repository";
import * as service from "./service";

let tenant: TenantContext;
let otherTenant: TenantContext;
let assetId: number;

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

	const [asset] = await db
		.insert(assets)
		.values({
			organizationId: tenant.organizationId,
			name: uniqueName("asset"),
			status: "operational",
			criticality: "normal",
			assignmentStatus: "available",
		})
		.returning({ id: assets.id });
	assetId = asset.id;
});

afterAll(async () => {
	await db.delete(tagAssignments).where(eq(tagAssignments.entityId, assetId));
	await db.delete(assets).where(eq(assets.id, assetId));
	await db.delete(tags).where(like(tags.name, `zz-test-%-${suffix}-%`));
});

describe("tags service", () => {
	it("creates a tag and lists it under its own type only", async () => {
		const assetTag = await service.create(tenant, {
			name: uniqueName("atag"),
			tag_type: "asset",
		});
		const partTag = await service.create(tenant, {
			name: uniqueName("ptag"),
			tag_type: "part",
		});

		const assetTags = await service.list(tenant, "asset");
		const assetTagIds = assetTags.map((tag) => tag.id);

		expect(assetTagIds).toContain(assetTag.id);
		expect(assetTagIds).not.toContain(partTag.id);
		expect(assetTag.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});

	it("rejects a duplicate name within the same type", async () => {
		const name = uniqueName("dup");
		await service.create(tenant, { name, tag_type: "asset" });

		expect(
			await codeOfRejection(() =>
				service.create(tenant, { name, tag_type: "asset" }),
			),
		).toBe("conflict");
	});

	it("allows the same name under a different type", async () => {
		const name = uniqueName("shared");
		const first = await service.create(tenant, { name, tag_type: "asset" });
		const second = await service.create(tenant, { name, tag_type: "location" });

		expect(second.id).not.toBe(first.id);
		expect(second.name).toBe(first.name);
	});

	it("renames a tag", async () => {
		const created = await service.create(tenant, {
			name: uniqueName("before"),
			tag_type: "asset",
		});
		const renamed = uniqueName("after");

		const updated = await service.update(tenant, created.id, { name: renamed });
		expect(updated.id).toBe(created.id);
		expect(updated.name).toBe(renamed);
	});

	it("keeps the name when the update omits it", async () => {
		const created = await service.create(tenant, {
			name: uniqueName("keep"),
			tag_type: "asset",
		});

		const updated = await service.update(tenant, created.id, {});
		expect(updated.name).toBe(created.name);
	});

	it("hard deletes the tag and its assignments, unlike the soft deleted domains", async () => {
		const created = await service.create(tenant, {
			name: uniqueName("doomed"),
			tag_type: "asset",
		});
		await setEntityTags(tenant.organizationId, "asset", assetId, [created.id]);

		const before = await tagsForEntities(tenant.organizationId, "asset", [
			assetId,
		]);
		expect(before.get(assetId)?.map((tag) => tag.id)).toEqual([created.id]);

		await service.remove(tenant, created.id);

		const rows = await db.select().from(tags).where(eq(tags.id, created.id));
		expect(rows).toHaveLength(0);

		const after = await tagsForEntities(tenant.organizationId, "asset", [
			assetId,
		]);
		expect(after.get(assetId) ?? []).toEqual([]);
	});

	it("refuses to touch another organization's tag", async () => {
		const created = await service.create(tenant, {
			name: uniqueName("mine"),
			tag_type: "asset",
		});

		expect(
			await codeOfRejection(() =>
				service.update(otherTenant, created.id, { name: "stolen" }),
			),
		).toBe("not_found");
		expect(
			await codeOfRejection(() => service.remove(otherTenant, created.id)),
		).toBe("not_found");

		const stillThere = await db
			.select({ id: tags.id })
			.from(tags)
			.where(inArray(tags.id, [created.id]));
		expect(stillThere).toHaveLength(1);
	});
});
