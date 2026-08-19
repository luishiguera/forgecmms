import { and, asc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db, type IDB } from "../../db/client";
import { organizations, userOrganizations, users } from "../../db/schema";
import { notFound } from "../../errors";
import type { MemberSearchParams } from "./schema";

const columns = {
	id: organizations.id,
	name: organizations.name,
	logoUrl: organizations.logoUrl,
	ownerId: organizations.ownerId,
	legalName: organizations.legalName,
	taxId: organizations.taxId,
	address: organizations.address,
	city: organizations.city,
	state: organizations.state,
	postalCode: organizations.postalCode,
	country: organizations.country,
	email: organizations.email,
	phone: organizations.phone,
	createdAt: organizations.createdAt,
};

const memberColumns = {
	id: users.id,
	fullName: users.fullName,
	photoUrl: users.photoUrl,
	email: users.email,
	hasBackoffice: userOrganizations.hasBackoffice,
	hasField: userOrganizations.hasField,
	workingHours: userOrganizations.workingHours,
	createdAt: users.createdAt,
};

export type OrganizationPatch = Partial<{
	name: string;
	logoUrl: string;
	legalName: string;
	taxId: string;
	address: string;
	city: string;
	state: string;
	postalCode: string;
	country: string;
	email: string;
	phone: string;
}>;

export const create = async (
	name: string,
	ownerId: number,
	logoUrl: string,
	dbc: IDB = db,
) => {
	const [row] = await dbc
		.insert(organizations)
		.values({ name, ownerId, logoUrl })
		.returning({ id: organizations.id });
	return row.id;
};

export const addMember = async (
	organizationId: number,
	userId: number,
	hasBackoffice: boolean,
	hasField: boolean,
	dbc: IDB = db,
) => {
	await dbc
		.insert(userOrganizations)
		.values({ organizationId, userId, hasBackoffice, hasField });
};

export const get = async (organizationId: number, dbc: IDB = db) => {
	const [row] = await dbc
		.select(columns)
		.from(organizations)
		.where(eq(organizations.id, organizationId))
		.limit(1);

	return row;
};

export const update = async (
	organizationId: number,
	patch: OrganizationPatch,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(organizations)
		.set({ ...patch, updatedAt: sql`NOW()` })
		.where(eq(organizations.id, organizationId))
		.returning({ id: organizations.id });

	if (rows.length === 0) throw notFound();
};

export const listForUser = async (userId: number, dbc: IDB = db) =>
	dbc
		.select({
			...columns,
			hasBackoffice: userOrganizations.hasBackoffice,
			hasField: userOrganizations.hasField,
		})
		.from(organizations)
		.innerJoin(
			userOrganizations,
			and(
				eq(userOrganizations.organizationId, organizations.id),
				eq(userOrganizations.userId, userId),
				isNull(userOrganizations.deletedAt),
			),
		)
		.orderBy(asc(organizations.name));

export const getMember = async (
	organizationId: number,
	userId: number,
	dbc: IDB = db,
) => {
	const [row] = await dbc
		.select(memberColumns)
		.from(users)
		.innerJoin(
			userOrganizations,
			and(
				eq(userOrganizations.userId, users.id),
				eq(userOrganizations.organizationId, organizationId),
				isNull(userOrganizations.deletedAt),
			),
		)
		.where(eq(users.id, userId))
		.limit(1);

	return row;
};

const memberFilters = (organizationId: number, params: MemberSearchParams) => {
	const pattern = params.q ? `%${params.q}%` : undefined;

	return and(
		eq(userOrganizations.organizationId, organizationId),
		isNull(userOrganizations.deletedAt),
		eq(users.status, "active"),
		pattern
			? or(ilike(users.fullName, pattern), ilike(users.email, pattern))
			: undefined,
		params.access === "backoffice"
			? eq(userOrganizations.hasBackoffice, true)
			: undefined,
		params.access === "field"
			? eq(userOrganizations.hasField, true)
			: undefined,
	);
};

export const searchMembers = async (
	organizationId: number,
	params: MemberSearchParams,
	dbc: IDB = db,
) => {
	const where = memberFilters(organizationId, params);

	const rows = await dbc
		.select(memberColumns)
		.from(users)
		.innerJoin(userOrganizations, eq(userOrganizations.userId, users.id))
		.where(where)
		.orderBy(asc(users.fullName))
		.limit(params.size)
		.offset((params.page - 1) * params.size);

	const [totals] = await dbc
		.select({ total: sql<number>`count(*)::int` })
		.from(users)
		.innerJoin(userOrganizations, eq(userOrganizations.userId, users.id))
		.where(where);

	return { rows, total: totals?.total ?? 0 };
};

export const updateMember = async (
	organizationId: number,
	userId: number,
	patch: Partial<{
		hasBackoffice: boolean;
		hasField: boolean;
		workingHours: typeof userOrganizations.$inferInsert.workingHours;
	}>,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(userOrganizations)
		.set(patch)
		.where(
			and(
				eq(userOrganizations.organizationId, organizationId),
				eq(userOrganizations.userId, userId),
				isNull(userOrganizations.deletedAt),
			),
		)
		.returning({ userId: userOrganizations.userId });

	if (rows.length === 0) throw notFound();
};

export const removeMember = async (
	organizationId: number,
	userId: number,
	removedBy: number,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(userOrganizations)
		.set({ deletedAt: sql`NOW()`, removedBy })
		.where(
			and(
				eq(userOrganizations.organizationId, organizationId),
				eq(userOrganizations.userId, userId),
				isNull(userOrganizations.deletedAt),
			),
		)
		.returning({ userId: userOrganizations.userId });

	if (rows.length === 0) throw notFound();
};

export type OrganizationRow = NonNullable<Awaited<ReturnType<typeof get>>>;
export type MemberRow = NonNullable<Awaited<ReturnType<typeof getMember>>>;
