import { toISO } from "../../db/client";
import { isForeignKeyViolation } from "../../db/pgerr";
import { notFound } from "../../errors";
import type { TenantContext } from "../../tenant";
import { type Paginated, paginate } from "../_shared/schema";
import type { ScheduleBlockRow } from "./repository";
import * as repository from "./repository";
import type {
	ScheduleBlockCreateInput,
	ScheduleBlockResponse,
	ScheduleBlockUpdateInput,
	ScheduleSearchParams,
} from "./schema";

const toResponse = (row: ScheduleBlockRow): ScheduleBlockResponse => ({
	id: row.id,
	user_id: row.userId,
	type: row.type,
	start_time: toISO(row.startTime),
	end_time: toISO(row.endTime),
	note: row.note,
	created_at: toISO(row.createdAt),
});

export const create = async (
	tc: TenantContext,
	input: ScheduleBlockCreateInput,
): Promise<ScheduleBlockResponse> => {
	const row = await repository
		.create({
			organizationId: tc.organizationId,
			userId: input.user_id,
			type: input.type,
			startTime: new Date(input.start_time),
			endTime: new Date(input.end_time),
			note: input.note,
		})
		.catch((error: unknown) => {
			if (isForeignKeyViolation(error)) throw notFound();
			throw error;
		});

	return toResponse(row);
};

export const update = async (
	tc: TenantContext,
	blockId: number,
	input: ScheduleBlockUpdateInput,
): Promise<ScheduleBlockResponse> => {
	const patch: repository.ScheduleBlockPatch = {};

	if (input.type !== undefined) patch.type = input.type;
	if (input.start_time !== undefined) {
		patch.startTime = new Date(input.start_time);
	}
	if (input.end_time !== undefined) patch.endTime = new Date(input.end_time);
	if (input.note !== undefined) patch.note = input.note;

	const row = await repository.update(tc.organizationId, blockId, patch);
	return toResponse(row);
};

export const remove = async (
	tc: TenantContext,
	blockId: number,
	ownScopedUserId?: number,
) => {
	await repository.softDelete(tc.organizationId, {
		id: blockId,
		userId: ownScopedUserId,
	});
};

export const search = async (
	tc: TenantContext,
	params: ScheduleSearchParams,
): Promise<Paginated<ScheduleBlockResponse>> => {
	const { rows, total } = await repository.search(tc.organizationId, params);
	return paginate(rows.map(toResponse), params, total);
};
