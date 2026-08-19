import { and, asc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db, type IDB } from "../../db/client";
import { assets, businesses, locations, tagAssignments } from "../../db/schema";
import { notFound } from "../../errors";
import type { LocationAssetItemResponse, LocationSearchParams } from "./schema";

const columns = {
	id: locations.id,
	parentLocationId: locations.parentLocationId,
	businessId: locations.businessId,
	name: locations.name,
	address: locations.address,
	city: locations.city,
	state: locations.state,
	postalCode: locations.postalCode,
	country: locations.country,
	description: locations.description,
	imageUrl: locations.imageUrl,
	latitude: locations.latitude,
	longitude: locations.longitude,
	phones: locations.phones,
	emails: locations.emails,
	createdAt: locations.createdAt,
	business: {
		id: businesses.id,
		name: businesses.name,
		type: businesses.type,
		imageUrl: businesses.imageUrl,
		phones: businesses.phones,
		emails: businesses.emails,
	},
};

const joinBusiness = (organizationId: number) =>
	and(
		eq(businesses.id, locations.businessId),
		eq(businesses.organizationId, organizationId),
		isNull(businesses.deletedAt),
	);

export type LocationInsert = typeof locations.$inferInsert;

export type LocationPatch = Partial<{
	parentLocationId: number;
	businessId: number | null;
	name: string;
	address: string;
	city: string;
	state: string;
	postalCode: string;
	country: string;
	description: string;
	imageUrl: string;
	latitude: number;
	longitude: number;
	phones: typeof locations.$inferInsert.phones;
	emails: typeof locations.$inferInsert.emails;
}>;

export const create = async (values: LocationInsert, dbc: IDB = db) => {
	const [row] = await dbc.insert(locations).values(values).returning({
		id: locations.id,
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
		.from(locations)
		.leftJoin(businesses, joinBusiness(organizationId))
		.where(
			and(
				eq(locations.id, id),
				eq(locations.organizationId, organizationId),
				isNull(locations.deletedAt),
			),
		)
		.limit(1);

	return row;
};

export const assetsForLocations = async (
	organizationId: number,
	locationIds: number[],
	dbc: IDB = db,
): Promise<Map<number, LocationAssetItemResponse[]>> => {
	const grouped = new Map<number, LocationAssetItemResponse[]>();
	if (locationIds.length === 0) return grouped;

	const rows = await dbc
		.select({
			id: assets.id,
			name: assets.name,
			serialNumber: assets.serialNumber,
			imageUrl: assets.imageUrl,
			status: assets.status,
			criticality: assets.criticality,
			locationId: assets.locationId,
			assignmentStatus: assets.assignmentStatus,
		})
		.from(assets)
		.where(
			and(
				eq(assets.organizationId, organizationId),
				inArray(assets.locationId, locationIds),
				isNull(assets.deletedAt),
			),
		)
		.orderBy(asc(assets.name));

	for (const row of rows) {
		if (row.locationId === null) continue;
		const list = grouped.get(row.locationId) ?? [];
		list.push({
			id: row.id,
			name: row.name,
			serial_number: row.serialNumber,
			image_url: row.imageUrl,
			status: row.status,
			criticality: row.criticality,
			location_id: row.locationId,
			assignment_status: row.assignmentStatus,
		});
		grouped.set(row.locationId, list);
	}

	return grouped;
};

export const update = async (
	organizationId: number,
	id: number,
	patch: LocationPatch,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(locations)
		.set({ ...patch, updatedAt: sql`NOW()` })
		.where(
			and(
				eq(locations.id, id),
				eq(locations.organizationId, organizationId),
				isNull(locations.deletedAt),
			),
		)
		.returning({ id: locations.id });

	if (rows.length === 0) throw notFound();
};

export const softDelete = async (
	organizationId: number,
	id: number,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(locations)
		.set({ deletedAt: sql`NOW()` })
		.where(
			and(
				eq(locations.id, id),
				eq(locations.organizationId, organizationId),
				isNull(locations.deletedAt),
			),
		)
		.returning({ id: locations.id });

	if (rows.length === 0) throw notFound();
};

const searchFilters = (
	organizationId: number,
	params: LocationSearchParams,
	dbc: IDB,
) => {
	const pattern = params.q ? `%${params.q}%` : undefined;

	return and(
		eq(locations.organizationId, organizationId),
		isNull(locations.deletedAt),
		pattern
			? or(ilike(locations.name, pattern), ilike(locations.address, pattern))
			: undefined,
		params.tag_id
			? inArray(
					locations.id,
					dbc
						.select({ entityId: tagAssignments.entityId })
						.from(tagAssignments)
						.where(
							and(
								eq(tagAssignments.organizationId, organizationId),
								eq(tagAssignments.tagId, params.tag_id),
								eq(tagAssignments.entityType, "location"),
							),
						),
				)
			: undefined,
	);
};

export const search = async (
	organizationId: number,
	params: LocationSearchParams,
	dbc: IDB = db,
) => {
	const where = searchFilters(organizationId, params, dbc);

	const rows = await dbc
		.select(columns)
		.from(locations)
		.leftJoin(businesses, joinBusiness(organizationId))
		.where(where)
		.orderBy(asc(locations.name))
		.limit(params.size)
		.offset((params.page - 1) * params.size);

	const total = await dbc.$count(locations, where);

	return { rows, total };
};

export type LocationRow = NonNullable<Awaited<ReturnType<typeof get>>>;
