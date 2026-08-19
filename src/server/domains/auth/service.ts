import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../../auth/password";
import {
	generateToken,
	RESET_TOKEN_DURATION_MS,
	SESSION_DURATION_MS,
} from "../../auth/session";
import * as tokenRepository from "../../auth/tokens";
import { db, toISO } from "../../db/client";
import { organizations, userOrganizations, users } from "../../db/schema";
import { AppError, notFound } from "../../errors";
import { sendMail } from "../../mail";
import { passwordResetEmail } from "../../mail/templates";
import * as organizationRepository from "../organizations/repository";
import type { Access } from "../organizations/schema";
import type {
	ChangePasswordInput,
	ForgotPasswordInput,
	LoginInput,
	LoginResponse,
	ResetPasswordInput,
	SignupInput,
	SignupResponse,
	UserOrganizationResponse,
} from "./schema";

const invalidCredentials = () =>
	new AppError("invalid_credentials", "invalid credentials");

const accessList = (hasBackoffice: boolean, hasField: boolean): Access[] => {
	const list: Access[] = [];
	if (hasBackoffice) list.push("backoffice");
	if (hasField) list.push("field");
	return list;
};

const findByEmail = async (email: string) => {
	const [row] = await db
		.select({
			id: users.id,
			email: users.email,
			fullName: users.fullName,
			password: users.password,
			status: users.status,
		})
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	return row;
};

const organizationsForUser = async (
	userId: number,
): Promise<UserOrganizationResponse[]> => {
	const rows = await organizationRepository.listForUser(userId);
	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		logo_url: row.logoUrl,
		accesses: accessList(row.hasBackoffice, row.hasField),
		is_owner: row.ownerId === userId,
	}));
};

const verifyCredentials = async (input: LoginInput) => {
	const user = await findByEmail(input.email);
	if (!user) throw invalidCredentials();
	if (user.status !== "active") throw invalidCredentials();

	const valid = await verifyPassword(input.password, user.password);
	if (!valid) throw invalidCredentials();

	return user;
};

export const signup = async (
	input: SignupInput,
): Promise<{ response: SignupResponse; token: string }> => {
	if (await findByEmail(input.email)) {
		throw new AppError("email_taken", "email not available");
	}

	const hashed = await hashPassword(input.password);
	const token = generateToken();

	const organizationId = await db.transaction(async (tx) => {
		const [user] = await tx
			.insert(users)
			.values({
				fullName: input.full_name,
				email: input.email,
				password: hashed,
				status: "active",
				language: "en-US",
				timezone: input.timezone,
				photoUrl: input.photo_url ?? "",
			})
			.returning({ id: users.id });

		const [organization] = await tx
			.insert(organizations)
			.values({ name: `${input.full_name} org`, ownerId: user.id })
			.returning({ id: organizations.id });

		await tx.insert(userOrganizations).values({
			organizationId: organization.id,
			userId: user.id,
			hasBackoffice: true,
			hasField: true,
		});

		await tokenRepository.create(
			token,
			user.id,
			"session",
			new Date(Date.now() + SESSION_DURATION_MS),
			tx,
		);

		return organization.id;
	});

	return { response: { organization_id: organizationId }, token };
};

export const login = async (
	input: LoginInput,
): Promise<{ response: LoginResponse; token: string }> => {
	const user = await verifyCredentials(input);
	const token = generateToken();

	await tokenRepository.create(
		token,
		user.id,
		"session",
		new Date(Date.now() + SESSION_DURATION_MS),
	);

	return {
		response: {
			user_id: user.id,
			organizations: await organizationsForUser(user.id),
		},
		token,
	};
};

export const logout = async (token: string) => {
	await tokenRepository.deleteByToken(token);
};

export const forgotPassword = async (input: ForgotPasswordInput) => {
	const user = await findByEmail(input.email);
	if (!user) return;

	await tokenRepository.deleteByUserAndType(user.id, "reset_password");

	const token = generateToken();
	await tokenRepository.create(
		token,
		user.id,
		"reset_password",
		new Date(Date.now() + RESET_TOKEN_DURATION_MS),
	);

	const url = `${process.env.BASE_URL ?? ""}/reset-password?token=${token}`;

	await sendMail({
		to: user.email,
		subject: "Password reset instructions",
		html: passwordResetEmail(user.fullName, url),
	});
};

export const resetPassword = async (input: ResetPasswordInput) => {
	const row = await tokenRepository.getByToken(input.token);
	if (!row || row.tokenType !== "reset_password") {
		throw new AppError("invalid_input", "invalid token");
	}
	if (row.expiresAt.getTime() <= Date.now()) {
		throw new AppError("token_expired", "token expired");
	}

	const hashed = await hashPassword(input.new_password);

	await db.transaction(async (tx) => {
		await tx
			.update(users)
			.set({ password: hashed })
			.where(eq(users.id, row.userId));
		await tokenRepository.deleteByUserAndType(row.userId, "session", tx);
		await tokenRepository.deleteByUserAndType(row.userId, "reset_password", tx);
	});
};

export const changePassword = async (
	userId: number,
	input: ChangePasswordInput,
) => {
	const [user] = await db
		.select({ password: users.password })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (!user) throw notFound();

	const valid = await verifyPassword(input.current_password, user.password);
	if (!valid) throw invalidCredentials();

	const hashed = await hashPassword(input.new_password);

	await db.transaction(async (tx) => {
		await tx
			.update(users)
			.set({ password: hashed })
			.where(eq(users.id, userId));
		await tokenRepository.deleteByUserAndType(userId, "session", tx);
	});
};

export const sessionExpiry = () =>
	toISO(new Date(Date.now() + SESSION_DURATION_MS));
