import { and, desc, eq } from "drizzle-orm";
import { db, type IDB } from "../../db/client";
import { invitations, organizations } from "../../db/schema";
import { notFound } from "../../errors";
import type { InvitationSearchParams, InvitationStatus } from "./schema";

const columns = {
	id: invitations.id,
	email: invitations.email,
	fullName: invitations.fullName,
	organizationId: invitations.organizationId,
	hasBackoffice: invitations.hasBackoffice,
	hasField: invitations.hasField,
	token: invitations.token,
	expiresAt: invitations.expiresAt,
	status: invitations.status,
	createdAt: invitations.createdAt,
};

export type InvitationInsert = typeof invitations.$inferInsert;

export const create = async (values: InvitationInsert, dbc: IDB = db) => {
	const [row] = await dbc.insert(invitations).values(values).returning(columns);
	return row;
};

export const get = async (
	organizationId: number,
	id: number,
	dbc: IDB = db,
) => {
	const [row] = await dbc
		.select(columns)
		.from(invitations)
		.where(
			and(
				eq(invitations.id, id),
				eq(invitations.organizationId, organizationId),
			),
		)
		.limit(1);

	return row;
};

export const getByToken = async (token: string, dbc: IDB = db) => {
	const [row] = await dbc
		.select({
			...columns,
			organizationName: organizations.name,
			organizationLogo: organizations.logoUrl,
		})
		.from(invitations)
		.innerJoin(organizations, eq(organizations.id, invitations.organizationId))
		.where(eq(invitations.token, token))
		.limit(1);

	return row;
};

export const findPending = async (
	organizationId: number,
	email: string,
	dbc: IDB = db,
) => {
	const [row] = await dbc
		.select(columns)
		.from(invitations)
		.where(
			and(
				eq(invitations.organizationId, organizationId),
				eq(invitations.email, email),
				eq(invitations.status, "pending"),
			),
		)
		.limit(1);

	return row;
};

export const setStatus = async (
	organizationId: number,
	id: number,
	status: InvitationStatus,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(invitations)
		.set({ status })
		.where(
			and(
				eq(invitations.id, id),
				eq(invitations.organizationId, organizationId),
			),
		)
		.returning({ id: invitations.id });

	if (rows.length === 0) throw notFound();
};

export const refresh = async (
	organizationId: number,
	id: number,
	token: string,
	expiresAt: Date,
	dbc: IDB = db,
) => {
	await dbc
		.update(invitations)
		.set({ token, expiresAt })
		.where(
			and(
				eq(invitations.id, id),
				eq(invitations.organizationId, organizationId),
			),
		);
};

export const search = async (
	organizationId: number,
	params: InvitationSearchParams,
	dbc: IDB = db,
) => {
	const where = and(
		eq(invitations.organizationId, organizationId),
		params.status ? eq(invitations.status, params.status) : undefined,
	);

	const rows = await dbc
		.select(columns)
		.from(invitations)
		.where(where)
		.orderBy(desc(invitations.createdAt))
		.limit(params.size)
		.offset((params.page - 1) * params.size);

	const total = await dbc.$count(invitations, where);

	return { rows, total };
};

export type InvitationRow = NonNullable<Awaited<ReturnType<typeof get>>>;
