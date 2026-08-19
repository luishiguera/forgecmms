import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db, type IDB, toISO } from "../../db/client";
import { tagAssignments, tags } from "../../db/schema";
import { notFound } from "../../errors";
import type { TagEntityType, TagResponse } from "../_shared/schema";

export type { TagResponse };

const columns = {
	id: tags.id,
	name: tags.name,
	createdAt: tags.createdAt,
};

export const list = async (
	organizationId: number,
	tagType: TagEntityType,
	dbc: IDB = db,
) =>
	dbc
		.select(columns)
		.from(tags)
		.where(
			and(eq(tags.organizationId, organizationId), eq(tags.tagType, tagType)),
		)
		.orderBy(asc(tags.name));

export const create = async (
	organizationId: number,
	tagType: TagEntityType,
	name: string,
	dbc: IDB = db,
) => {
	const [row] = await dbc
		.insert(tags)
		.values({ organizationId, tagType, name })
		.returning(columns);
	return row;
};

export type TagPatch = Partial<{ name: string }>;

export const update = async (
	organizationId: number,
	id: number,
	patch: TagPatch,
	dbc: IDB = db,
) => {
	const [row] = await dbc
		.update(tags)
		.set({ ...patch, updatedAt: sql`NOW()` })
		.where(and(eq(tags.id, id), eq(tags.organizationId, organizationId)))
		.returning(columns);

	if (!row) throw notFound();
	return row;
};

export const hardDelete = async (
	organizationId: number,
	id: number,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.delete(tags)
		.where(and(eq(tags.id, id), eq(tags.organizationId, organizationId)))
		.returning({ id: tags.id });

	if (rows.length === 0) throw notFound();
};

export const tagsForEntities = async (
	organizationId: number,
	entityType: TagEntityType,
	entityIds: number[],
	dbc: IDB = db,
): Promise<Map<number, TagResponse[]>> => {
	const grouped = new Map<number, TagResponse[]>();
	if (entityIds.length === 0) return grouped;

	const rows = await dbc
		.select({
			entityId: tagAssignments.entityId,
			id: tags.id,
			name: tags.name,
			createdAt: tags.createdAt,
		})
		.from(tagAssignments)
		.innerJoin(tags, eq(tags.id, tagAssignments.tagId))
		.where(
			and(
				eq(tagAssignments.organizationId, organizationId),
				eq(tagAssignments.entityType, entityType),
				inArray(tagAssignments.entityId, entityIds),
			),
		);

	for (const row of rows) {
		const list = grouped.get(row.entityId) ?? [];
		list.push({
			id: row.id,
			name: row.name,
			created_at: toISO(row.createdAt),
		});
		grouped.set(row.entityId, list);
	}

	return grouped;
};

export const setEntityTags = async (
	organizationId: number,
	entityType: TagEntityType,
	entityId: number,
	tagIds: number[],
	dbc: IDB = db,
) => {
	await dbc
		.delete(tagAssignments)
		.where(
			and(
				eq(tagAssignments.organizationId, organizationId),
				eq(tagAssignments.entityType, entityType),
				eq(tagAssignments.entityId, entityId),
			),
		);

	if (tagIds.length === 0) return;

	await dbc.insert(tagAssignments).values(
		tagIds.map((tagId) => ({
			organizationId,
			tagId,
			entityType,
			entityId,
		})),
	);
};
