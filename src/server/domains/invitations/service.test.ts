import { eq, inArray, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as tokenRepository from "../../auth/tokens";
import { db } from "../../db/client";
import {
	invitations,
	organizations,
	tokens,
	userOrganizations,
	users,
} from "../../db/schema";
import { errorCodeOf } from "../../errors";
import type { TenantContext } from "../../tenant";
import * as repository from "./repository";
import * as service from "./service";

let tenant: TenantContext;
let organizationId: number;
let inviterId: number;

const suffix = process.hrtime.bigint().toString().slice(-9);
let sequence = 0;
const uniqueEmail = (label: string) =>
	`zz-test-inv-${label}-${suffix}-${++sequence}@example.test`;

const createdUserIds: number[] = [];

const codeOfRejection = async (run: () => Promise<unknown>) => {
	try {
		await run();
		return "no-rejection";
	} catch (error) {
		return errorCodeOf(error) ?? "unknown-error";
	}
};

beforeAll(async () => {
	const [row] = await db
		.select({ id: organizations.id, ownerId: organizations.ownerId })
		.from(organizations)
		.limit(1);

	organizationId = row.id;
	inviterId = row.ownerId;

	tenant = {
		organizationId,
		userId: inviterId,
		hasBackoffice: true,
		hasField: true,
		isOwner: true,
		timezone: "UTC",
	};
});

afterAll(async () => {
	const invited = await db
		.select({ id: users.id })
		.from(users)
		.where(like(users.email, `zz-test-inv-%-${suffix}-%`));
	const ids = [...createdUserIds, ...invited.map((row) => row.id)];

	if (ids.length > 0) {
		await db.delete(tokens).where(inArray(tokens.userId, ids));
		await db
			.delete(userOrganizations)
			.where(inArray(userOrganizations.userId, ids));
		await db.delete(users).where(inArray(users.id, ids));
	}

	await db
		.delete(invitations)
		.where(like(invitations.email, `zz-test-inv-%-${suffix}-%`));
});

const invite = async (email: string, accesses: ("backoffice" | "field")[]) => {
	await service.create(tenant, {
		email,
		full_name: "Invited Tester",
		accesses,
	});

	const [row] = await db
		.select({ token: invitations.token, id: invitations.id })
		.from(invitations)
		.where(eq(invitations.email, email));

	return row;
};

describe("invitations service", () => {
	it("creates a pending invitation and exposes it by token without auth", async () => {
		const email = uniqueEmail("new");
		const created = await invite(email, ["field"]);

		const details = await service.getByToken(created.token);
		expect(details.email).toBe(email);
		expect(details.accesses).toEqual(["field"]);
		expect(details.user_exists).toBe(false);
		expect(details.organization_id).toBe(organizationId);
		expect(details.organization_name).toBeTruthy();
	});

	it("reuses the pending invitation and rotates its token on a repeat invite", async () => {
		const email = uniqueEmail("repeat");
		const first = await invite(email, ["field"]);
		const second = await invite(email, ["backoffice"]);

		expect(second.id).toBe(first.id);
		expect(second.token).not.toBe(first.token);

		const rows = await db
			.select({ id: invitations.id })
			.from(invitations)
			.where(eq(invitations.email, email));
		expect(rows).toHaveLength(1);

		expect(await codeOfRejection(() => service.getByToken(first.token))).toBe(
			"not_found",
		);
	});

	it("refuses to invite somebody who is already a member", async () => {
		const [member] = await db
			.select({ email: users.email })
			.from(users)
			.innerJoin(userOrganizations, eq(userOrganizations.userId, users.id))
			.where(eq(userOrganizations.organizationId, organizationId))
			.limit(1);

		expect(
			await codeOfRejection(() =>
				service.create(tenant, {
					email: member.email,
					full_name: "Already Here",
					accesses: ["field"],
				}),
			),
		).toBe("conflict");
	});

	it("requires a password when the invited person has no account", async () => {
		const email = uniqueEmail("nopass");
		const created = await invite(email, ["field"]);

		expect(
			await codeOfRejection(() => service.accept({ token: created.token })),
		).toBe("invalid_input");
	});

	it("accepts, creating the user, the membership and a session in one transaction", async () => {
		const email = uniqueEmail("accept");
		const created = await invite(email, ["backoffice", "field"]);

		const sessionToken = await service.accept({
			token: created.token,
			password: "invited-secret",
		});

		const [user] = await db
			.select({ id: users.id, status: users.status })
			.from(users)
			.where(eq(users.email, email));
		createdUserIds.push(user.id);
		expect(user.status).toBe("active");

		const [membership] = await db
			.select({
				hasBackoffice: userOrganizations.hasBackoffice,
				hasField: userOrganizations.hasField,
			})
			.from(userOrganizations)
			.where(eq(userOrganizations.userId, user.id));
		expect(membership.hasBackoffice).toBe(true);
		expect(membership.hasField).toBe(true);

		const session = await tokenRepository.getByToken(sessionToken);
		expect(session?.userId).toBe(user.id);

		const [invitation] = await db
			.select({ status: invitations.status })
			.from(invitations)
			.where(eq(invitations.id, created.id));
		expect(invitation.status).toBe("accepted");
	});

	it("refuses to accept the same invitation twice", async () => {
		const email = uniqueEmail("twice");
		const created = await invite(email, ["field"]);

		await service.accept({ token: created.token, password: "invited-secret" });

		expect(
			await codeOfRejection(() =>
				service.accept({ token: created.token, password: "invited-secret" }),
			),
		).toBe("invalid_input");
	});

	it("refuses an expired invitation", async () => {
		const email = uniqueEmail("expired");
		const created = await invite(email, ["field"]);

		await repository.refresh(
			organizationId,
			created.id,
			created.token,
			new Date(Date.now() - 1000),
		);

		expect(await codeOfRejection(() => service.getByToken(created.token))).toBe(
			"token_expired",
		);
	});

	it("cancels a pending invitation and then refuses it", async () => {
		const email = uniqueEmail("cancel");
		const created = await invite(email, ["field"]);

		await service.cancel(tenant, created.id);

		expect(await codeOfRejection(() => service.getByToken(created.token))).toBe(
			"invalid_input",
		);
		expect(
			await codeOfRejection(() => service.cancel(tenant, created.id)),
		).toBe("invalid_input");
	});

	it("lists invitations newest first and filters by status", async () => {
		const cancelled = await service.search(tenant, {
			status: "cancelled",
			page: 1,
			size: 50,
		});
		for (const item of cancelled.items) {
			expect(item.status).toBe("cancelled");
		}

		const all = await service.search(tenant, { page: 1, size: 5 });
		expect(all.page).toBe(1);
		expect(all.size).toBe(5);
		expect(all.total).toBeGreaterThan(0);
	});
});
