import { z } from "zod";
import { entityIdSchema, paginationSchema } from "../_shared/schema";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const trackUpdateSchema = z.object({
	latitude: z.number().min(-90).max(90),
	longitude: z.number().min(-180).max(180),
});

export const trackSearchParamsSchema = paginationSchema.extend({
	track_date_from: isoDate.optional(),
	track_date_to: isoDate.optional(),
	user_ids: z.array(entityIdSchema).optional(),
});

export type TrackUpdateInput = z.infer<typeof trackUpdateSchema>;
export type TrackSearchParams = z.infer<typeof trackSearchParamsSchema>;
export type TrackSearchPayload = z.input<typeof trackSearchParamsSchema>;

export type TrackLocationResponse = {
	user_id: number;
	full_name: string;
	photo_url: string;
	email: string;
	latitude: number;
	longitude: number;
	track_date: string;
	updated_at: string;
};
