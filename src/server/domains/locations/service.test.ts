import { and, eq, inArray, isNull } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../../db/client";
import {
	assets,
	businesses,
	locations,
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
let businessId: number;
const createdLocationIds: number[] = [];
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
			tagType: "location",
			name: uniqueName("tag"),
		})
		.returning({ id: tags.id });
	tagId = tag.id;

	const [business] = await db
		.insert(businesses)
		.values({
			organizationId: tenant.organizationId,
			name: uniqueName("business"),
			type: "customer",
			phones: [{ number: "600100200" }],
			emails: [{ address: "ops@example.test" }],
		})
		.returning({ id: businesses.id });
	businessId = business.id;
});

afterAll(async () => {
	if (createdAssetIds.length > 0) {
		await db.delete(assets).where(inArray(assets.id, createdAssetIds));
	}
	if (createdLocationIds.length > 0) {
		await db
			.delete(tagAssignments)
			.where(inArray(tagAssignments.entityId, createdLocationIds));
		await db.delete(locations).where(inArray(locations.id, createdLocationIds));
	}
	if (businessId) {
		await db.delete(businesses).where(eq(businesses.id, businessId));
	}
	if (tagId) await db.delete(tags).where(eq(tags.id, tagId));
});

const createLocation = async (overrides: Record<string, unknown> = {}) => {
	const location = await service.create(tenant, {
		name: uniqueName("location"),
		address: "",
		city: "",
		state: "",
		postal_code: "",
		country: "",
		description: "",
		image_url: "",
		phones: [],
		emails: [],
		...overrides,
	} as Parameters<typeof service.create>[1]);
	createdLocationIds.push(location.id);
	return location;
};

const attachAsset = async (locationId: number) => {
	const [asset] = await db
		.insert(assets)
		.values({
			organizationId: tenant.organizationId,
			locationId,
			name: uniqueName("asset"),
			status: "operational",
			criticality: "normal",
			assignmentStatus: "installed",
		})
		.returning({ id: assets.id });
	createdAssetIds.push(asset.id);
	return asset.id;
};

describe("locations service", () => {
	it("creates a location with contact entries in the stored jsonb shape", async () => {
		const location = await createLocation({
			address: "Calle Mayor 1",
			city: "Madrid",
			country: "ES",
			latitude: 40.4168,
			longitude: -3.7038,
			phones: [{ number: "600123456" }],
			emails: [{ address: "site@example.test" }],
			tag_ids: [tagId],
		});

		expect(location.city).toBe("Madrid");
		expect(location.latitude).toBe(40.4168);
		expect(location.longitude).toBe(-3.7038);
		expect(location.phones).toEqual([{ number: "600123456" }]);
		expect(location.emails).toEqual([{ address: "site@example.test" }]);
		expect(location.tags.map((tag) => tag.id)).toEqual([tagId]);
		expect(location.business).toBeNull();
		expect(location.assets).toEqual([]);
	});

	it("embeds the business on get and on search", async () => {
		const created = await createLocation({ business_id: businessId });

		expect(created.business).not.toBeNull();
		expect(created.business?.id).toBe(businessId);
		expect(created.business?.phones).toEqual([{ number: "600100200" }]);

		const result = await service.search(tenant, {
			q: created.name,
			page: 1,
			size: 20,
		});
		expect(result.items[0].business?.id).toBe(businessId);
	});

	it("embeds assets on get but not on search, matching the Go contract", async () => {
		const created = await createLocation();
		const assetId = await attachAsset(created.id);

		const fetched = await service.get(tenant, created.id);
		expect(fetched.assets.map((asset) => asset.id)).toEqual([assetId]);
		expect(fetched.assets[0].assignment_status).toBe("installed");

		const result = await service.search(tenant, {
			q: created.name,
			page: 1,
			size: 20,
		});
		expect(result.items[0].assets).toEqual([]);
	});

	it("hides a soft deleted business instead of failing", async () => {
		const created = await createLocation({ business_id: businessId });
		await db
			.update(businesses)
			.set({ deletedAt: new Date() })
			.where(eq(businesses.id, businessId));

		const fetched = await service.get(tenant, created.id);
		expect(fetched.business).toBeNull();
		expect(fetched.business_id).toBe(businessId);

		await db
			.update(businesses)
			.set({ deletedAt: null })
			.where(eq(businesses.id, businessId));
	});

	it("clears the business with an explicit null but keeps it on an absent key", async () => {
		const created = await createLocation({ business_id: businessId });

		const untouched = await service.update(tenant, created.id, {
			city: "Valencia",
		});
		expect(untouched.business_id).toBe(businessId);

		const cleared = await service.update(tenant, created.id, {
			business_id: null,
		});
		expect(cleared.business_id).toBeNull();
		expect(cleared.business).toBeNull();
		expect(cleared.city).toBe("Valencia");
	});

	it("replaces the phone list on update", async () => {
		const created = await createLocation({
			phones: [{ number: "600111111" }, { number: "600222222" }],
		});

		const updated = await service.update(tenant, created.id, {
			phones: [{ number: "600333333" }],
		});
		expect(updated.phones).toEqual([{ number: "600333333" }]);
	});

	it("finds the location by address", async () => {
		const address = uniqueName("avenue");
		const created = await createLocation({ address });

		const result = await service.search(tenant, {
			q: address,
			page: 1,
			size: 20,
		});
		expect(result.total).toBe(1);
		expect(result.items[0].id).toBe(created.id);
	});

	it("hides locations from another organization", async () => {
		const created = await createLocation();
		expect(
			await codeOfRejection(() => service.get(otherTenant, created.id)),
		).toBe("not_found");
	});

	it("soft deletes and then reports not found", async () => {
		const created = await createLocation();
		await service.remove(tenant, created.id);

		expect(await codeOfRejection(() => service.get(tenant, created.id))).toBe(
			"not_found",
		);
	});
});
