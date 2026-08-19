import { and, eq, isNull, notInArray } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "./db/client";
import { organizations, userOrganizations, users } from "./db/schema";
import { errorCodeOf } from "./errors";
import { resolveTenant } from "./tenant";

let ownerId: number;
let organizationId: number;
let outsiderId: number | undefined;

const codeOfRejection = async (run: () => Promise<unknown>) => {
	try {
		await run();
		return "no-rejection";
	} catch (error) {
		return errorCodeOf(error) ?? "unknown-error";
	}
};

beforeAll(async () => {
	const [org] = await db
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
		.limit(1);

	if (!org) throw new Error("seed the database before running these tests");

	organizationId = org.id;
	ownerId = org.ownerId;

	const members = await db
		.select({ userId: userOrganizations.userId })
		.from(userOrganizations)
		.where(eq(userOrganizations.organizationId, organizationId));

	const [outsider] = await db
		.select({ id: users.id })
		.from(users)
		.where(
			notInArray(
				users.id,
				members.map((member) => member.userId),
			),
		)
		.limit(1);
	outsiderId = outsider?.id;
});

describe("resolveTenant", () => {
	it("grants the owner backoffice access and marks them as owner", async () => {
		const tenant = await resolveTenant(ownerId, organizationId, "backoffice");
		expect(tenant.organizationId).toBe(organizationId);
		expect(tenant.userId).toBe(ownerId);
		expect(tenant.hasBackoffice).toBe(true);
		expect(tenant.isOwner).toBe(true);
		expect(typeof tenant.timezone).toBe("string");
	});

	it("grants any membership access by default", async () => {
		const tenant = await resolveTenant(ownerId, organizationId);
		expect(tenant.organizationId).toBe(organizationId);
		expect(tenant.hasBackoffice || tenant.hasField).toBe(true);
	});

	it("rejects a user who is not a member", async () => {
		if (outsiderId === undefined) {
			throw new Error("no non-member user available in this database");
		}
		expect(
			await codeOfRejection(() =>
				resolveTenant(outsiderId as number, organizationId, "backoffice"),
			),
		).toBe("forbidden");
	});

	it("rejects an organization that does not exist", async () => {
		expect(
			await codeOfRejection(() =>
				resolveTenant(ownerId, 999_999_999, "backoffice"),
			),
		).toBe("forbidden");
	});

	it("grants a field only membership every access except backoffice", async () => {
		let anyCode = "not-run";
		let fieldCode = "not-run";
		let backofficeCode = "not-run";

		await db
			.transaction(async (tx) => {
				await tx
					.update(userOrganizations)
					.set({ hasBackoffice: false, hasField: true })
					.where(
						and(
							eq(userOrganizations.userId, ownerId),
							eq(userOrganizations.organizationId, organizationId),
						),
					);

				anyCode = await codeOfRejection(() =>
					resolveTenant(ownerId, organizationId, "any", tx),
				);
				fieldCode = await codeOfRejection(() =>
					resolveTenant(ownerId, organizationId, "field", tx),
				);
				backofficeCode = await codeOfRejection(() =>
					resolveTenant(ownerId, organizationId, "backoffice", tx),
				);

				throw new Error("rollback");
			})
			.catch((error: Error) => {
				if (error.message !== "rollback") throw error;
			});

		expect(anyCode).toBe("no-rejection");
		expect(fieldCode).toBe("no-rejection");
		expect(backofficeCode).toBe("forbidden");
	});

	it("rejects a soft deleted membership", async () => {
		let code = "not-run";

		await db
			.transaction(async (tx) => {
				await tx
					.update(userOrganizations)
					.set({ deletedAt: new Date() })
					.where(
						and(
							eq(userOrganizations.userId, ownerId),
							eq(userOrganizations.organizationId, organizationId),
						),
					);

				code = await codeOfRejection(() =>
					resolveTenant(ownerId, organizationId, "backoffice", tx),
				);

				throw new Error("rollback");
			})
			.catch((error: Error) => {
				if (error.message !== "rollback") throw error;
			});

		expect(code).toBe("forbidden");

		const stillGranted = await resolveTenant(
			ownerId,
			organizationId,
			"backoffice",
		);
		expect(stillGranted.hasBackoffice).toBe(true);
	});
});
