import { and, asc, eq, ilike, inArray, isNull, sql } from "drizzle-orm";
import { db, type IDB } from "../../db/client";
import { businesses, locations } from "../../db/schema";
import { notFound } from "../../errors";
import type {
	BusinessLocationItemResponse,
	BusinessSearchParams,
} from "./schema";

const columns = {
	id: businesses.id,
	name: businesses.name,
	taxId: businesses.taxId,
	type: businesses.type,
	description: businesses.description,
	imageUrl: businesses.imageUrl,
	phones: businesses.phones,
	emails: businesses.emails,
	createdAt: businesses.createdAt,
};

export type BusinessInsert = typeof businesses.$inferInsert;

export type BusinessPatch = Partial<{
	name: string;
	taxId: string;
	type: typeof businesses.$inferInsert.type;
	description: string;
	imageUrl: string;
	phones: typeof businesses.$inferInsert.phones;
	emails: typeof businesses.$inferInsert.emails;
}>;

export const create = async (values: BusinessInsert, dbc: IDB = db) => {
	const [row] = await dbc.insert(businesses).values(values).returning({
		id: businesses.id,
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
		.from(businesses)
		.where(
			and(
				eq(businesses.id, id),
				eq(businesses.organizationId, organizationId),
				isNull(businesses.deletedAt),
			),
		)
		.limit(1);

	return row;
};

export const locationsForBusinesses = async (
	organizationId: number,
	businessIds: number[],
	dbc: IDB = db,
): Promise<Map<number, BusinessLocationItemResponse[]>> => {
	const grouped = new Map<number, BusinessLocationItemResponse[]>();
	if (businessIds.length === 0) return grouped;

	const rows = await dbc
		.select({
			id: locations.id,
			businessId: locations.businessId,
			name: locations.name,
			address: locations.address,
			imageUrl: locations.imageUrl,
		})
		.from(locations)
		.where(
			and(
				eq(locations.organizationId, organizationId),
				inArray(locations.businessId, businessIds),
				isNull(locations.deletedAt),
			),
		)
		.orderBy(asc(locations.name));

	for (const row of rows) {
		if (row.businessId === null) continue;
		const list = grouped.get(row.businessId) ?? [];
		list.push({
			id: row.id,
			name: row.name,
			address: row.address,
			image_url: row.imageUrl,
		});
		grouped.set(row.businessId, list);
	}

	return grouped;
};

export const update = async (
	organizationId: number,
	id: number,
	patch: BusinessPatch,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(businesses)
		.set({ ...patch, updatedAt: sql`NOW()` })
		.where(
			and(
				eq(businesses.id, id),
				eq(businesses.organizationId, organizationId),
				isNull(businesses.deletedAt),
			),
		)
		.returning({ id: businesses.id });

	if (rows.length === 0) throw notFound();
};

export const softDelete = async (
	organizationId: number,
	id: number,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(businesses)
		.set({ deletedAt: sql`NOW()` })
		.where(
			and(
				eq(businesses.id, id),
				eq(businesses.organizationId, organizationId),
				isNull(businesses.deletedAt),
			),
		)
		.returning({ id: businesses.id });

	if (rows.length === 0) throw notFound();
};

const searchFilters = (organizationId: number, params: BusinessSearchParams) =>
	and(
		eq(businesses.organizationId, organizationId),
		isNull(businesses.deletedAt),
		params.q ? ilike(businesses.name, `%${params.q}%`) : undefined,
		params.type ? eq(businesses.type, params.type) : undefined,
	);

export const search = async (
	organizationId: number,
	params: BusinessSearchParams,
	dbc: IDB = db,
) => {
	const where = searchFilters(organizationId, params);

	const rows = await dbc
		.select(columns)
		.from(businesses)
		.where(where)
		.orderBy(asc(businesses.name))
		.limit(params.size)
		.offset((params.page - 1) * params.size);

	const total = await dbc.$count(businesses, where);

	return { rows, total };
};

export type BusinessRow = NonNullable<Awaited<ReturnType<typeof get>>>;
