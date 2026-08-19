import { and, asc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db, type IDB } from "../../db/client";
import { assets, locations, tagAssignments } from "../../db/schema";
import { notFound } from "../../errors";
import type { AssetSearchParams } from "./schema";

const columns = {
	id: assets.id,
	parentAssetId: assets.parentAssetId,
	locationId: assets.locationId,
	serialNumber: assets.serialNumber,
	model: assets.model,
	manufacturer: assets.manufacturer,
	name: assets.name,
	description: assets.description,
	status: assets.status,
	criticality: assets.criticality,
	assignmentStatus: assets.assignmentStatus,
	imageUrl: assets.imageUrl,
	createdAt: assets.createdAt,
	location: {
		id: locations.id,
		name: locations.name,
		address: locations.address,
		imageUrl: locations.imageUrl,
	},
};

export type AssetInsert = typeof assets.$inferInsert;

export type AssetPatch = Partial<{
	serialNumber: string;
	model: string;
	manufacturer: string;
	name: string;
	description: string;
	status: typeof assets.$inferInsert.status;
	criticality: typeof assets.$inferInsert.criticality;
	assignmentStatus: typeof assets.$inferInsert.assignmentStatus;
	imageUrl: string;
	locationId: number | null;
	parentAssetId: number | null;
}>;

export const create = async (values: AssetInsert, dbc: IDB = db) => {
	const [row] = await dbc.insert(assets).values(values).returning({
		id: assets.id,
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
		.from(assets)
		.leftJoin(
			locations,
			and(eq(locations.id, assets.locationId), isNull(locations.deletedAt)),
		)
		.where(
			and(
				eq(assets.id, id),
				eq(assets.organizationId, organizationId),
				isNull(assets.deletedAt),
			),
		)
		.limit(1);

	return row;
};

export const update = async (
	organizationId: number,
	id: number,
	patch: AssetPatch,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(assets)
		.set({ ...patch, updatedAt: sql`NOW()` })
		.where(
			and(
				eq(assets.id, id),
				eq(assets.organizationId, organizationId),
				isNull(assets.deletedAt),
			),
		)
		.returning({ id: assets.id });

	if (rows.length === 0) throw notFound();
};

export const softDelete = async (
	organizationId: number,
	id: number,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(assets)
		.set({ deletedAt: sql`NOW()` })
		.where(
			and(
				eq(assets.id, id),
				eq(assets.organizationId, organizationId),
				isNull(assets.deletedAt),
			),
		)
		.returning({ id: assets.id });

	if (rows.length === 0) throw notFound();
};

const searchFilters = (
	organizationId: number,
	params: AssetSearchParams,
	dbc: IDB,
) => {
	const pattern = params.q ? `%${params.q}%` : undefined;

	return and(
		eq(assets.organizationId, organizationId),
		isNull(assets.deletedAt),
		pattern
			? or(
					ilike(assets.name, pattern),
					ilike(assets.serialNumber, pattern),
					ilike(assets.model, pattern),
					ilike(assets.manufacturer, pattern),
					ilike(assets.description, pattern),
				)
			: undefined,
		params.status ? eq(assets.status, params.status) : undefined,
		params.criticality ? eq(assets.criticality, params.criticality) : undefined,
		params.location_id ? eq(assets.locationId, params.location_id) : undefined,
		params.tag_id
			? inArray(
					assets.id,
					dbc
						.select({ entityId: tagAssignments.entityId })
						.from(tagAssignments)
						.where(
							and(
								eq(tagAssignments.organizationId, organizationId),
								eq(tagAssignments.tagId, params.tag_id),
								eq(tagAssignments.entityType, "asset"),
							),
						),
				)
			: undefined,
	);
};

export const search = async (
	organizationId: number,
	params: AssetSearchParams,
	dbc: IDB = db,
) => {
	const where = searchFilters(organizationId, params, dbc);

	const rows = await dbc
		.select(columns)
		.from(assets)
		.leftJoin(
			locations,
			and(eq(locations.id, assets.locationId), isNull(locations.deletedAt)),
		)
		.where(where)
		.orderBy(asc(assets.name))
		.limit(params.size)
		.offset((params.page - 1) * params.size);

	const total = await dbc.$count(assets, where);

	return { rows, total };
};

export type AssetRow = NonNullable<Awaited<ReturnType<typeof get>>>;
