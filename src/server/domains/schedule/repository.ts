import { and, asc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { db, type IDB } from "../../db/client";
import { scheduleBlocks } from "../../db/schema";
import { notFound } from "../../errors";
import type { ScheduleSearchParams } from "./schema";

const columns = {
	id: scheduleBlocks.id,
	userId: scheduleBlocks.userId,
	type: scheduleBlocks.type,
	startTime: scheduleBlocks.startTime,
	endTime: scheduleBlocks.endTime,
	note: scheduleBlocks.note,
	createdAt: scheduleBlocks.createdAt,
};

export type ScheduleBlockInsert = typeof scheduleBlocks.$inferInsert;

export type ScheduleBlockPatch = Partial<{
	type: string;
	startTime: Date;
	endTime: Date;
	note: string;
}>;

export type DeleteFilter = {
	id: number;
	userId?: number;
};

export const create = async (values: ScheduleBlockInsert, dbc: IDB = db) => {
	const [row] = await dbc
		.insert(scheduleBlocks)
		.values(values)
		.returning(columns);
	return row;
};

export const update = async (
	organizationId: number,
	id: number,
	patch: ScheduleBlockPatch,
	dbc: IDB = db,
) => {
	const [row] = await dbc
		.update(scheduleBlocks)
		.set(patch)
		.where(
			and(
				eq(scheduleBlocks.id, id),
				eq(scheduleBlocks.organizationId, organizationId),
				isNull(scheduleBlocks.deletedAt),
			),
		)
		.returning(columns);

	if (!row) throw notFound();
	return row;
};

export const softDelete = async (
	organizationId: number,
	filter: DeleteFilter,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(scheduleBlocks)
		.set({ deletedAt: sql`NOW()` })
		.where(
			and(
				eq(scheduleBlocks.id, filter.id),
				eq(scheduleBlocks.organizationId, organizationId),
				isNull(scheduleBlocks.deletedAt),
				filter.userId ? eq(scheduleBlocks.userId, filter.userId) : undefined,
			),
		)
		.returning({ id: scheduleBlocks.id });

	if (rows.length === 0) throw notFound();
};

export const search = async (
	organizationId: number,
	params: ScheduleSearchParams,
	dbc: IDB = db,
) => {
	const where = and(
		eq(scheduleBlocks.organizationId, organizationId),
		isNull(scheduleBlocks.deletedAt),
		params.user_id ? eq(scheduleBlocks.userId, params.user_id) : undefined,
		params.date_from
			? gte(scheduleBlocks.endTime, new Date(params.date_from))
			: undefined,
		params.date_to
			? lt(scheduleBlocks.startTime, new Date(params.date_to))
			: undefined,
	);

	const rows = await dbc
		.select(columns)
		.from(scheduleBlocks)
		.where(where)
		.orderBy(asc(scheduleBlocks.startTime))
		.limit(params.size)
		.offset((params.page - 1) * params.size);

	const total = await dbc.$count(scheduleBlocks, where);

	return { rows, total };
};

export type ScheduleBlockRow = Awaited<ReturnType<typeof create>>;
