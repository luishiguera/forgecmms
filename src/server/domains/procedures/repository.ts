import { and, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db, type IDB } from "../../db/client";
import { procedures, tagAssignments } from "../../db/schema";
import { notFound } from "../../errors";
import type { ProcedureFields, ProcedureSearchParams } from "./schema";

const columns = {
	id: procedures.id,
	name: procedures.name,
	description: procedures.description,
	status: procedures.status,
	fields: procedures.fields,
	usesCount: procedures.usesCount,
	createdAt: procedures.createdAt,
	updatedAt: procedures.updatedAt,
};

export type ProcedureInsert = typeof procedures.$inferInsert;

export type ProcedurePatch = Partial<{
	name: string;
	description: string;
	status: typeof procedures.$inferInsert.status;
	fields: ProcedureFields;
}>;

export const create = async (values: ProcedureInsert, dbc: IDB = db) => {
	const [row] = await dbc.insert(procedures).values(values).returning({
		id: procedures.id,
	});
	return row.id;
};

export const get = async (
	organizationId: number,
	id: number,
	dbc: IDB = db,
) => {
	const [row] = await dbc
		.select(columns)
		.from(procedures)
		.where(
			and(
				eq(procedures.id, id),
				eq(procedures.organizationId, organizationId),
				isNull(procedures.deletedAt),
			),
		)
		.limit(1);

	return row;
};

export const getByIds = async (
	organizationId: number,
	ids: number[],
	dbc: IDB = db,
) => {
	if (ids.length === 0) return [];

	return dbc
		.select(columns)
		.from(procedures)
		.where(
			and(
				eq(procedures.organizationId, organizationId),
				inArray(procedures.id, ids),
				isNull(procedures.deletedAt),
			),
		);
};

export const update = async (
	organizationId: number,
	id: number,
	patch: ProcedurePatch,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(procedures)
		.set({ ...patch, updatedAt: sql`NOW()` })
		.where(
			and(
				eq(procedures.id, id),
				eq(procedures.organizationId, organizationId),
				isNull(procedures.deletedAt),
			),
		)
		.returning({ id: procedures.id });

	if (rows.length === 0) throw notFound();
};

export const softDelete = async (
	organizationId: number,
	id: number,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(procedures)
		.set({ deletedAt: sql`NOW()` })
		.where(
			and(
				eq(procedures.id, id),
				eq(procedures.organizationId, organizationId),
				isNull(procedures.deletedAt),
			),
		)
		.returning({ id: procedures.id });

	if (rows.length === 0) throw notFound();
};

const searchFilters = (
	organizationId: number,
	params: ProcedureSearchParams,
	dbc: IDB,
) => {
	const pattern = params.q ? `%${params.q}%` : undefined;

	return and(
		eq(procedures.organizationId, organizationId),
		isNull(procedures.deletedAt),
		pattern
			? or(
					ilike(procedures.name, pattern),
					ilike(procedures.description, pattern),
				)
			: undefined,
		params.status ? eq(procedures.status, params.status) : undefined,
		params.tag_id
			? inArray(
					procedures.id,
					dbc
						.select({ entityId: tagAssignments.entityId })
						.from(tagAssignments)
						.where(
							and(
								eq(tagAssignments.organizationId, organizationId),
								eq(tagAssignments.tagId, params.tag_id),
								eq(tagAssignments.entityType, "procedure"),
							),
						),
				)
			: undefined,
	);
};

export const search = async (
	organizationId: number,
	params: ProcedureSearchParams,
	dbc: IDB = db,
) => {
	const where = searchFilters(organizationId, params, dbc);

	const rows = await dbc
		.select(columns)
		.from(procedures)
		.where(where)
		.orderBy(desc(procedures.updatedAt))
		.limit(params.size)
		.offset((params.page - 1) * params.size);

	const total = await dbc.$count(procedures, where);

	return { rows, total };
};

export type ProcedureRow = NonNullable<Awaited<ReturnType<typeof get>>>;
