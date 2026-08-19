import { eq, inArray, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "../../auth/password";
import * as tokenRepository from "../../auth/tokens";
import { db } from "../../db/client";
import {
	organizations,
	tokens,
	userOrganizations,
	users,
} from "../../db/schema";
import { errorCodeOf } from "../../errors";
import * as service from "./service";

const suffix = process.hrtime.bigint().toString().slice(-9);
const email = `zz-test-auth-${suffix}@example.test`;
const inactiveEmail = `zz-test-inactive-${suffix}@example.test`;

let userId: number;
let inactiveUserId: number;
const createdOrganizationIds: number[] = [];

const codeOfRejection = async (run: () => Promise<unknown>) => {
	try {
		await run();
		return "no-rejection";
	} catch (error) {
		return errorCodeOf(error) ?? "unknown-error";
	}
};

beforeAll(async () => {
	const [inactive] = await db
		.insert(users)
		.values({
			fullName: "Inactive Tester",
			email: inactiveEmail,
			password: await hashPassword("original-secret"),
			status: "inactive",
			language: "en-US",
			timezone: "UTC",
		})
		.returning({ id: users.id });
	inactiveUserId = inactive.id;
});

afterAll(async () => {
	const ids = [userId, inactiveUserId].filter(Boolean);
	if (ids.length > 0) {
		await db.delete(tokens).where(inArray(tokens.userId, ids));
		await db
			.delete(userOrganizations)
			.where(inArray(userOrganizations.userId, ids));
	}
	if (createdOrganizationIds.length > 0) {
		await db
			.delete(organizations)
			.where(inArray(organizations.id, createdOrganizationIds));
	}
	if (ids.length > 0) {
		await db.delete(users).where(inArray(users.id, ids));
	}
	await db.delete(users).where(like(users.email, `zz-test-%-${suffix}@%`));
});

describe("auth service", () => {
	it("signs up, creating the user, organization, membership and session together", async () => {
		const { response, token } = await service.signup({
			email,
			password: "first-secret",
			full_name: "Auth Tester",
			timezone: "Europe/Madrid",
		});

		createdOrganizationIds.push(response.organization_id);
		expect(response.organization_id).toBeGreaterThan(0);
		expect(token).toHaveLength(64);

		const [user] = await db
			.select({ id: users.id, timezone: users.timezone })
			.from(users)
			.where(eq(users.email, email));
		userId = user.id;
		expect(user.timezone).toBe("Europe/Madrid");

		const [organization] = await db
			.select({ name: organizations.name, ownerId: organizations.ownerId })
			.from(organizations)
			.where(eq(organizations.id, response.organization_id));
		expect(organization.name).toBe("Auth Tester org");
		expect(organization.ownerId).toBe(userId);

		const [membership] = await db
			.select({
				hasBackoffice: userOrganizations.hasBackoffice,
				hasField: userOrganizations.hasField,
			})
			.from(userOrganizations)
			.where(eq(userOrganizations.userId, userId));
		expect(membership.hasBackoffice).toBe(true);
		expect(membership.hasField).toBe(true);

		const stored = await tokenRepository.getByToken(token);
		expect(stored?.tokenType).toBe("session");
	});

	it("refuses a second signup with the same email", async () => {
		expect(
			await codeOfRejection(() =>
				service.signup({
					email,
					password: "another-secret",
					full_name: "Impostor",
					timezone: "UTC",
				}),
			),
		).toBe("email_taken");
	});

	it("logs in and returns the caller's organizations", async () => {
		const { response, token } = await service.login({
			email,
			password: "first-secret",
		});

		expect(response.user_id).toBe(userId);
		expect(response.organizations).toHaveLength(1);
		expect(response.organizations[0].is_owner).toBe(true);
		expect(response.organizations[0].accesses).toEqual(["backoffice", "field"]);

		await service.logout(token);
		expect(await tokenRepository.getByToken(token)).toBeUndefined();
	});

	it("rejects a wrong password and an unknown email with the same code", async () => {
		expect(
			await codeOfRejection(() =>
				service.login({ email, password: "wrong-secret" }),
			),
		).toBe("invalid_credentials");

		expect(
			await codeOfRejection(() =>
				service.login({
					email: `missing-${suffix}@example.test`,
					password: "whatever",
				}),
			),
		).toBe("invalid_credentials");
	});

	it("refuses to log in an inactive user who knows the password", async () => {
		expect(
			await codeOfRejection(() =>
				service.login({ email: inactiveEmail, password: "original-secret" }),
			),
		).toBe("invalid_credentials");
	});

	it("stays silent when asked to reset an unknown email", async () => {
		await expect(
			service.forgotPassword({ email: `nobody-${suffix}@example.test` }),
		).resolves.toBeUndefined();
	});

	it("resets the password and destroys every existing session", async () => {
		const { token: liveSession } = await service.login({
			email,
			password: "first-secret",
		});

		await service.forgotPassword({ email });

		const resetRows = await db
			.select({ token: tokens.token, tokenType: tokens.tokenType })
			.from(tokens)
			.where(eq(tokens.userId, userId));
		const resetToken = resetRows.find(
			(row) => row.tokenType === "reset_password",
		)?.token;

		if (!resetToken) throw new Error("no reset token issued");

		await service.resetPassword({
			token: resetToken,
			new_password: "second-secret",
		});

		expect(await tokenRepository.getByToken(liveSession)).toBeUndefined();
		expect(await tokenRepository.getByToken(resetToken)).toBeUndefined();

		const { response } = await service.login({
			email,
			password: "second-secret",
		});
		expect(response.user_id).toBe(userId);
	});

	it("refuses a reset token that is not a reset token", async () => {
		const { token: session } = await service.login({
			email,
			password: "second-secret",
		});

		expect(
			await codeOfRejection(() =>
				service.resetPassword({ token: session, new_password: "third-secret" }),
			),
		).toBe("invalid_input");
	});

	it("refuses an expired reset token", async () => {
		const expired = "e".repeat(64);
		await tokenRepository.create(
			expired,
			userId,
			"reset_password",
			new Date(Date.now() - 1000),
		);

		expect(
			await codeOfRejection(() =>
				service.resetPassword({ token: expired, new_password: "third-secret" }),
			),
		).toBe("token_expired");
	});

	it("changes the password only with the correct current one", async () => {
		expect(
			await codeOfRejection(() =>
				service.changePassword(userId, {
					current_password: "not-it",
					new_password: "fourth-secret",
				}),
			),
		).toBe("invalid_credentials");

		await service.changePassword(userId, {
			current_password: "second-secret",
			new_password: "fourth-secret",
		});

		const { response } = await service.login({
			email,
			password: "fourth-secret",
		});
		expect(response.user_id).toBe(userId);
	});
});
