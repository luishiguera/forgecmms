import { z } from "zod";
import { entityIdSchema, paginationSchema } from "../_shared/schema";

export const scheduleBlockTypeSchema = z.enum([
	"break",
	"travel",
	"meeting",
	"block",
]);

const instant = z.iso.datetime({ offset: true });

export const scheduleSearchParamsSchema = paginationSchema.extend({
	user_id: entityIdSchema.optional(),
	date_from: instant.optional(),
	date_to: instant.optional(),
});

export const scheduleBlockCreateSchema = z.object({
	user_id: entityIdSchema,
	type: scheduleBlockTypeSchema,
	start_time: instant,
	end_time: instant,
	note: z.string().max(5000).default(""),
});

export const scheduleBlockUpdateSchema = z.object({
	type: scheduleBlockTypeSchema.optional(),
	start_time: instant.optional(),
	end_time: instant.optional(),
	note: z.string().max(5000).optional(),
});

export type ScheduleBlockType = z.infer<typeof scheduleBlockTypeSchema>;
export type ScheduleSearchParams = z.infer<typeof scheduleSearchParamsSchema>;
export type ScheduleBlockCreateInput = z.infer<
	typeof scheduleBlockCreateSchema
>;
export type ScheduleBlockUpdateInput = z.infer<
	typeof scheduleBlockUpdateSchema
>;
export type ScheduleSearchPayload = z.input<typeof scheduleSearchParamsSchema>;
export type ScheduleBlockCreatePayload = z.input<
	typeof scheduleBlockCreateSchema
>;

export type ScheduleBlockResponse = {
	id: number;
	user_id: number;
	type: string;
	start_time: string;
	end_time: string;
	note: string;
	created_at: string;
};
