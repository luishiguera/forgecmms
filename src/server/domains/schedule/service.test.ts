import { and, eq, isNull } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../../db/client";
import {
	organizations,
	scheduleBlocks,
	userOrganizations,
} from "../../db/schema";
import { errorCodeOf } from "../../errors";
import type { TenantContext } from "../../tenant";
import * as service from "./service";

let tenant: TenantContext;
let otherTenant: TenantContext;

const createdIds: number[] = [];

const MADRID = "Europe/Madrid";

const tenantFor = (
	organizationId: number,
	userId: number,
	timezone = MADRID,
): TenantContext => ({
	organizationId,
	userId,
	hasBackoffice: true,
	hasField: true,
	isOwner: true,
	timezone,
});

const codeOfRejection = async (run: () => Promise<unknown>) => {
	try {
		await run();
		return "no-rejection";
	} catch (error) {
		return errorCodeOf(error) ?? "unknown-error";
	}
};

const createBlock = async (
	startTime: string,
	endTime: string,
	note = "zz-test-block",
) => {
	const block = await service.create(tenant, {
		user_id: tenant.userId,
		type: "break",
		start_time: startTime,
		end_time: endTime,
		note,
	});
	createdIds.push(block.id);
	return block;
};

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
	for (const id of createdIds) {
		await db.delete(scheduleBlocks).where(eq(scheduleBlocks.id, id));
	}
});

describe("schedule blocks", () => {
	it("returns the blocks that fall inside the requested window", async () => {
		const inside = await createBlock(
			"2031-06-10T09:00:00Z",
			"2031-06-10T09:30:00Z",
		);
		const outside = await createBlock(
			"2031-06-14T09:00:00Z",
			"2031-06-14T09:30:00Z",
		);

		const result = await service.search(tenant, {
			user_id: tenant.userId,
			date_from: "2031-06-09T00:00:00Z",
			date_to: "2031-06-12T00:00:00Z",
			page: 1,
			size: 50,
		});

		const ids = result.items.map((item) => item.id);
		expect(ids).toContain(inside.id);
		expect(ids).not.toContain(outside.id);
	});

	it("keeps a block that starts late in the day in the same local day", async () => {
		const late = await createBlock(
			"2031-06-10T22:30:00Z",
			"2031-06-10T23:00:00Z",
		);

		const result = await service.search(tenant, {
			user_id: tenant.userId,
			date_from: "2031-06-09T00:00:00Z",
			date_to: "2031-06-12T00:00:00Z",
			page: 1,
			size: 50,
		});

		const found = result.items.find((item) => item.id === late.id);
		expect(found).toBeDefined();
		expect(
			new Intl.DateTimeFormat("en-CA", {
				timeZone: MADRID,
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			}).format(new Date(found?.start_time ?? "")),
		).toBe("2031-06-11");
	});

	it("does not leak blocks to another organization", async () => {
		const mine = await createBlock(
			"2031-06-10T11:00:00Z",
			"2031-06-10T11:30:00Z",
		);

		const result = await service.search(otherTenant, {
			date_from: "2031-06-09T00:00:00Z",
			date_to: "2031-06-12T00:00:00Z",
			page: 1,
			size: 50,
		});

		expect(result.items.map((item) => item.id)).not.toContain(mine.id);
	});

	it("removes a block only for its own user when the delete is own scoped", async () => {
		const block = await createBlock(
			"2031-06-10T13:00:00Z",
			"2031-06-10T13:30:00Z",
		);

		expect(
			await codeOfRejection(() =>
				service.remove(tenant, block.id, tenant.userId + 1_000_000),
			),
		).toBe("not_found");
		expect(await blockExists(block.id)).toBe(true);

		await service.remove(tenant, block.id, tenant.userId);
		expect(await blockExists(block.id)).toBe(false);
	});

	it("rejects a block for a user outside the organization", async () => {
		expect(
			await codeOfRejection(() =>
				service.create(tenant, {
					user_id: 999_999_999,
					type: "break",
					start_time: "2031-06-10T15:00:00Z",
					end_time: "2031-06-10T15:30:00Z",
					note: "",
				}),
			),
		).toBe("not_found");
	});
});

const blockExists = async (id: number) => {
	const [row] = await db
		.select({ id: scheduleBlocks.id })
		.from(scheduleBlocks)
		.where(and(eq(scheduleBlocks.id, id), isNull(scheduleBlocks.deletedAt)));
	return !!row;
};
