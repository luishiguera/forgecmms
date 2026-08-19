import {
	and,
	asc,
	eq,
	gte,
	ilike,
	inArray,
	isNull,
	lt,
	or,
	sql,
} from "drizzle-orm";
import { db, type IDB } from "../../db/client";
import { parts, tagAssignments } from "../../db/schema";
import { notFound } from "../../errors";
import type { PartSearchParams } from "./schema";

const columns = {
	id: parts.id,
	sku: parts.sku,
	name: parts.name,
	description: parts.description,
	quantity: parts.quantity,
	minQuantity: parts.minQuantity,
	unitPrice: parts.unitPrice,
	currency: parts.currency,
	unitOfMeasure: parts.unitOfMeasure,
	imageUrl: parts.imageUrl,
	createdAt: parts.createdAt,
};

export type PartInsert = typeof parts.$inferInsert;

export type PartPatch = Partial<{
	sku: string;
	name: string;
	description: string;
	quantity: number;
	minQuantity: number;
	unitPrice: number;
	currency: string;
	unitOfMeasure: string;
	imageUrl: string;
}>;

export const create = async (values: PartInsert, dbc: IDB = db) => {
	const [row] = await dbc.insert(parts).values(values).returning({
		id: parts.id,
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
		.from(parts)
		.where(
			and(
				eq(parts.id, id),
				eq(parts.organizationId, organizationId),
				isNull(parts.deletedAt),
			),
		)
		.limit(1);

	return row;
};

export const update = async (
	organizationId: number,
	id: number,
	patch: PartPatch,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(parts)
		.set({ ...patch, updatedAt: sql`NOW()` })
		.where(
			and(
				eq(parts.id, id),
				eq(parts.organizationId, organizationId),
				isNull(parts.deletedAt),
			),
		)
		.returning({ id: parts.id });

	if (rows.length === 0) throw notFound();
};

export const adjustStock = async (
	organizationId: number,
	id: number,
	delta: number,
	dbc: IDB = db,
) => {
	await dbc
		.update(parts)
		.set({
			quantity: sql`${parts.quantity} + ${delta}`,
			updatedAt: sql`NOW()`,
		})
		.where(
			and(
				eq(parts.id, id),
				eq(parts.organizationId, organizationId),
				isNull(parts.deletedAt),
			),
		);
};

export const softDelete = async (
	organizationId: number,
	id: number,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(parts)
		.set({ deletedAt: sql`NOW()` })
		.where(
			and(
				eq(parts.id, id),
				eq(parts.organizationId, organizationId),
				isNull(parts.deletedAt),
			),
		)
		.returning({ id: parts.id });

	if (rows.length === 0) throw notFound();
};

const searchFilters = (
	organizationId: number,
	params: PartSearchParams,
	dbc: IDB,
) => {
	const pattern = params.q ? `%${params.q}%` : undefined;

	return and(
		eq(parts.organizationId, organizationId),
		isNull(parts.deletedAt),
		pattern
			? or(
					ilike(parts.name, pattern),
					ilike(parts.sku, pattern),
					ilike(parts.description, pattern),
				)
			: undefined,
		params.stock === "low" ? lt(parts.quantity, parts.minQuantity) : undefined,
		params.stock === "ok" ? gte(parts.quantity, parts.minQuantity) : undefined,
		params.tag_id
			? inArray(
					parts.id,
					dbc
						.select({ entityId: tagAssignments.entityId })
						.from(tagAssignments)
						.where(
							and(
								eq(tagAssignments.organizationId, organizationId),
								eq(tagAssignments.tagId, params.tag_id),
								eq(tagAssignments.entityType, "part"),
							),
						),
				)
			: undefined,
	);
};

export const search = async (
	organizationId: number,
	params: PartSearchParams,
	dbc: IDB = db,
) => {
	const where = searchFilters(organizationId, params, dbc);

	const rows = await dbc
		.select(columns)
		.from(parts)
		.where(where)
		.orderBy(asc(parts.name))
		.limit(params.size)
		.offset((params.page - 1) * params.size);

	const total = await dbc.$count(parts, where);

	return { rows, total };
};

export type PartRow = NonNullable<Awaited<ReturnType<typeof get>>>;
