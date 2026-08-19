import { and, eq, inArray, isNull } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../../db/client";
import {
	businesses,
	locations,
	organizations,
	userOrganizations,
} from "../../db/schema";
import { errorCodeOf } from "../../errors";
import type { TenantContext } from "../../tenant";
import * as service from "./service";

let tenant: TenantContext;
let otherTenant: TenantContext;
const createdBusinessIds: number[] = [];
const createdLocationIds: number[] = [];

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
});

afterAll(async () => {
	if (createdLocationIds.length > 0) {
		await db.delete(locations).where(inArray(locations.id, createdLocationIds));
	}
	if (createdBusinessIds.length > 0) {
		await db
			.delete(businesses)
			.where(inArray(businesses.id, createdBusinessIds));
	}
});

const createBusiness = async (overrides: Record<string, unknown> = {}) => {
	const business = await service.create(tenant, {
		name: uniqueName("business"),
		tax_id: "",
		type: "customer",
		description: "",
		image_url: "",
		phones: [],
		emails: [],
		...overrides,
	} as Parameters<typeof service.create>[1]);
	createdBusinessIds.push(business.id);
	return business;
};

const attachLocation = async (businessId: number) => {
	const [location] = await db
		.insert(locations)
		.values({
			organizationId: tenant.organizationId,
			businessId,
			name: uniqueName("site"),
			address: "Calle Mayor 2",
		})
		.returning({ id: locations.id });
	createdLocationIds.push(location.id);
	return location.id;
};

describe("businesses service", () => {
	it("creates a business with contacts and defaults", async () => {
		const business = await createBusiness({
			tax_id: "B12345678",
			type: "vendor",
			phones: [{ number: "600999888" }],
			emails: [{ address: "sales@example.test" }],
		});

		expect(business.tax_id).toBe("B12345678");
		expect(business.type).toBe("vendor");
		expect(business.phones).toEqual([{ number: "600999888" }]);
		expect(business.emails).toEqual([{ address: "sales@example.test" }]);
		expect(business.locations).toEqual([]);
		expect(business.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});

	it("embeds locations on get but not on search, matching the Go contract", async () => {
		const created = await createBusiness();
		const locationId = await attachLocation(created.id);

		const fetched = await service.get(tenant, created.id);
		expect(fetched.locations.map((item) => item.id)).toEqual([locationId]);
		expect(fetched.locations[0].address).toBe("Calle Mayor 2");

		const result = await service.search(tenant, {
			q: created.name,
			page: 1,
			size: 20,
		});
		expect(result.items[0].locations).toEqual([]);
	});

	it("omits a soft deleted location from the embed", async () => {
		const created = await createBusiness();
		const locationId = await attachLocation(created.id);

		await db
			.update(locations)
			.set({ deletedAt: new Date() })
			.where(eq(locations.id, locationId));

		expect((await service.get(tenant, created.id)).locations).toEqual([]);
	});

	it("filters by type", async () => {
		const vendor = await createBusiness({ type: "vendor" });
		const customer = await createBusiness({ type: "customer" });

		const result = await service.search(tenant, {
			q: `zz-test-business-${suffix}`,
			type: "vendor",
			page: 1,
			size: 50,
		});

		const ids = result.items.map((item) => item.id);
		expect(ids).toContain(vendor.id);
		expect(ids).not.toContain(customer.id);
	});

	it("applies a partial update and leaves other fields alone", async () => {
		const created = await createBusiness({ description: "keep-me" });
		const updated = await service.update(tenant, created.id, {
			tax_id: "X999",
		});

		expect(updated.tax_id).toBe("X999");
		expect(updated.description).toBe("keep-me");
		expect(updated.name).toBe(created.name);
	});

	it("hides businesses from another organization", async () => {
		const created = await createBusiness();
		expect(
			await codeOfRejection(() => service.get(otherTenant, created.id)),
		).toBe("not_found");
	});

	it("soft deletes and then reports not found", async () => {
		const created = await createBusiness();
		await service.remove(tenant, created.id);

		expect(await codeOfRejection(() => service.get(tenant, created.id))).toBe(
			"not_found",
		);
		expect(
			await codeOfRejection(() => service.remove(tenant, created.id)),
		).toBe("not_found");
	});
});
