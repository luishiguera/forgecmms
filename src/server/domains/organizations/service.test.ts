import { and, eq, isNull } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../../db/client";
import { organizations, userOrganizations } from "../../db/schema";
import { errorCodeOf } from "../../errors";
import type { TenantContext } from "../../tenant";
import * as service from "./service";

let ownerTenant: TenantContext;
let memberTenant: TenantContext;
let organizationId: number;
let ownerId: number;
let memberId: number;

const codeOfRejection = async (run: () => Promise<unknown>) => {
	try {
		await run();
		return "no-rejection";
	} catch (error) {
		return errorCodeOf(error) ?? "unknown-error";
	}
};

const tenantFor = (userId: number, isOwner: boolean): TenantContext => ({
	organizationId,
	userId,
	hasBackoffice: true,
	hasField: true,
	isOwner,
	timezone: "UTC",
});

beforeAll(async () => {
	const rows = await db
		.select({
			organizationId: organizations.id,
			ownerId: organizations.ownerId,
			userId: userOrganizations.userId,
		})
		.from(organizations)
		.innerJoin(
			userOrganizations,
			and(
				eq(userOrganizations.organizationId, organizations.id),
				isNull(userOrganizations.deletedAt),
			),
		);

	const candidate = rows.find(
		(row) =>
			row.userId !== row.ownerId &&
			rows.some(
				(other) =>
					other.organizationId === row.organizationId &&
					other.userId === other.ownerId,
			),
	);

	if (!candidate) {
		throw new Error("these tests need an organization with a non-owner member");
	}

	organizationId = candidate.organizationId;
	ownerId = candidate.ownerId;
	memberId = candidate.userId;

	ownerTenant = tenantFor(ownerId, true);
	memberTenant = tenantFor(memberId, false);
});

let originalWorkingHours: unknown;

beforeAll(async () => {
	const [row] = await db
		.select({ workingHours: userOrganizations.workingHours })
		.from(userOrganizations)
		.where(
			and(
				eq(userOrganizations.organizationId, organizationId),
				eq(userOrganizations.userId, memberId),
			),
		);
	originalWorkingHours = row?.workingHours;
});

afterAll(async () => {
	await db
		.update(userOrganizations)
		.set({
			workingHours: originalWorkingHours as never,
		})
		.where(
			and(
				eq(userOrganizations.organizationId, organizationId),
				eq(userOrganizations.userId, memberId),
			),
		);
});

describe("organizations service", () => {
	it("returns the organization with the caller's own accesses and ownership", async () => {
		const asOwner = await service.get(ownerTenant);
		expect(asOwner.id).toBe(organizationId);
		expect(asOwner.is_owner).toBe(true);
		expect(asOwner.accesses).toEqual(["backoffice", "field"]);

		const asMember = await service.get(memberTenant);
		expect(asMember.is_owner).toBe(false);
	});

	it("finds the member and flags the owner", async () => {
		const owner = await service.getMember(ownerTenant, ownerId);
		expect(owner.is_owner).toBe(true);
		expect(owner.user_id).toBe(ownerId);

		const member = await service.getMember(ownerTenant, memberId);
		expect(member.is_owner).toBe(false);
	});

	it("lets any member edit working hours but only the owner edit accesses", async () => {
		await service.updateMember(memberTenant, memberId, {
			working_hours: [
				{ weekday: 1, enabled: true, from: "08:00", to: "16:00" },
			],
		});

		const updated = await service.getMember(ownerTenant, memberId);
		expect(updated.working_hours).toEqual([
			{ weekday: 1, enabled: true, from: "08:00", to: "16:00" },
		]);

		expect(
			await codeOfRejection(() =>
				service.updateMember(memberTenant, memberId, {
					accesses: ["backoffice"],
				}),
			),
		).toBe("forbidden");
	});

	it("refuses to change or remove the owner", async () => {
		expect(
			await codeOfRejection(() =>
				service.updateMember(ownerTenant, ownerId, {
					accesses: ["field"],
				}),
			),
		).toBe("forbidden");

		expect(
			await codeOfRejection(() => service.removeMember(ownerTenant, ownerId)),
		).toBe("forbidden");
	});

	it("refuses member removal by a non owner", async () => {
		expect(
			await codeOfRejection(() => service.removeMember(memberTenant, memberId)),
		).toBe("forbidden");
	});

	it("lists the organizations a user belongs to", async () => {
		const list = await service.listForUser(ownerId);
		expect(list.map((item) => item.id)).toContain(organizationId);
		expect(list.find((item) => item.id === organizationId)?.is_owner).toBe(
			true,
		);
	});

	it("finds members by name or email and honours the access filter", async () => {
		const member = await service.getMember(ownerTenant, memberId);

		const byEmail = await service.searchMembers(ownerTenant, {
			q: member.email,
			page: 1,
			size: 20,
		});
		expect(byEmail.items.map((item) => item.user_id)).toContain(memberId);

		const backoffice = await service.searchMembers(ownerTenant, {
			access: "backoffice",
			page: 1,
			size: 100,
		});
		for (const item of backoffice.items) {
			expect(item.accesses).toContain("backoffice");
		}
	});
});
