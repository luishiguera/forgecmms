import { eq } from "drizzle-orm";
import { hashPassword } from "../../auth/password";
import { generateToken, SESSION_DURATION_MS } from "../../auth/session";
import * as tokenRepository from "../../auth/tokens";
import { db, toISO } from "../../db/client";
import { userOrganizations, users } from "../../db/schema";
import { AppError, conflict, notFound } from "../../errors";
import { sendMail } from "../../mail";
import { invitationEmail } from "../../mail/templates";
import type { TenantContext } from "../../tenant";
import { type Paginated, paginate } from "../_shared/schema";
import * as organizationRepository from "../organizations/repository";
import type { Access } from "../organizations/schema";
import type { InvitationRow } from "./repository";
import * as repository from "./repository";
import type {
	InvitationAcceptInput,
	InvitationCreateInput,
	InvitationDetailsResponse,
	InvitationResponse,
	InvitationSearchParams,
} from "./schema";

const INVITATION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const accessList = (hasBackoffice: boolean, hasField: boolean): Access[] => {
	const list: Access[] = [];
	if (hasBackoffice) list.push("backoffice");
	if (hasField) list.push("field");
	return list;
};

const toResponse = (row: InvitationRow): InvitationResponse => ({
	id: row.id,
	email: row.email,
	full_name: row.fullName,
	accesses: accessList(row.hasBackoffice, row.hasField),
	status: row.status,
	expires_at: toISO(row.expiresAt),
	created_at: toISO(row.createdAt),
});

const findUserByEmail = async (email: string) => {
	const [row] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	return row;
};

const invitationUrl = (token: string) =>
	`${process.env.BASE_URL ?? ""}/accept-invitation?token=${token}`;

const usable = (row: { status: string; expiresAt: Date }) => {
	if (row.status === "cancelled") {
		throw new AppError("invalid_input", "invitation cancelled");
	}
	if (row.status === "accepted") {
		throw new AppError("invalid_input", "invitation already used");
	}
	if (row.status === "expired" || row.expiresAt.getTime() <= Date.now()) {
		throw new AppError("token_expired", "invitation expired");
	}
};

export const create = async (
	tc: TenantContext,
	input: InvitationCreateInput,
) => {
	const organization = await organizationRepository.get(tc.organizationId);
	if (!organization) throw notFound();

	const inviter = await db
		.select({ fullName: users.fullName })
		.from(users)
		.where(eq(users.id, tc.userId))
		.limit(1);
	if (inviter.length === 0) throw notFound();

	const existingUser = await findUserByEmail(input.email);
	if (existingUser) {
		const membership = await organizationRepository.getMember(
			tc.organizationId,
			existingUser.id,
		);
		if (membership) throw conflict("user already a member");
	}

	const pending = await repository.findPending(tc.organizationId, input.email);
	const token = generateToken();
	const expiresAt = new Date(Date.now() + INVITATION_DURATION_MS);

	if (pending) {
		await repository.refresh(tc.organizationId, pending.id, token, expiresAt);
	} else {
		await repository.create({
			email: input.email,
			fullName: input.full_name,
			organizationId: tc.organizationId,
			hasBackoffice: input.accesses.includes("backoffice"),
			hasField: input.accesses.includes("field"),
			token,
			expiresAt,
			status: "pending",
			inviterId: tc.userId,
		});
	}

	await sendMail({
		to: input.email,
		subject: `You've been invited to join ${organization.name} on forgecmms`,
		html: invitationEmail(
			organization.name,
			inviter[0].fullName,
			invitationUrl(token),
		),
	});
};

export const getByToken = async (
	token: string,
): Promise<InvitationDetailsResponse> => {
	const row = await repository.getByToken(token);
	if (!row) throw notFound();

	usable(row);

	return {
		organization_id: row.organizationId,
		organization_name: row.organizationName,
		organization_logo: row.organizationLogo,
		email: row.email,
		full_name: row.fullName,
		accesses: accessList(row.hasBackoffice, row.hasField),
		user_exists: Boolean(await findUserByEmail(row.email)),
	};
};

export const accept = async (input: InvitationAcceptInput) => {
	const row = await repository.getByToken(input.token);
	if (!row) throw notFound();

	usable(row);

	const existingUser = await findUserByEmail(row.email);
	if (!existingUser && !input.password) {
		throw new AppError("invalid_input", "password required");
	}

	const hashed = existingUser
		? undefined
		: await hashPassword(input.password ?? "");
	const sessionToken = generateToken();

	await db.transaction(async (tx) => {
		let userId = existingUser?.id;

		if (!userId) {
			const [created] = await tx
				.insert(users)
				.values({
					fullName: row.fullName,
					email: row.email,
					password: hashed ?? "",
					status: "active",
					language: "en-US",
					timezone: "UTC",
				})
				.returning({ id: users.id });
			userId = created.id;
		}

		await tx.insert(userOrganizations).values({
			organizationId: row.organizationId,
			userId,
			hasBackoffice: row.hasBackoffice,
			hasField: row.hasField,
		});

		await repository.setStatus(row.organizationId, row.id, "accepted", tx);

		await tokenRepository.create(
			sessionToken,
			userId,
			"session",
			new Date(Date.now() + SESSION_DURATION_MS),
			tx,
		);
	});

	return sessionToken;
};

export const search = async (
	tc: TenantContext,
	params: InvitationSearchParams,
): Promise<Paginated<InvitationResponse>> => {
	const { rows, total } = await repository.search(tc.organizationId, params);
	return paginate(rows.map(toResponse), params, total);
};

export const cancel = async (tc: TenantContext, invitationId: number) => {
	const row = await repository.get(tc.organizationId, invitationId);
	if (!row) throw notFound();

	if (row.status !== "pending") {
		throw new AppError(
			"invalid_input",
			"only a pending invitation can be cancelled",
		);
	}

	await repository.setStatus(tc.organizationId, invitationId, "cancelled");
};
