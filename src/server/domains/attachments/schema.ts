import { z } from "zod";
import { entityIdSchema } from "../_shared/schema";

export const attachmentEntityTypeSchema = z.enum([
	"asset",
	"part",
	"location",
	"workorder",
]);

export const attachmentListParamsSchema = z.object({
	entity_type: attachmentEntityTypeSchema,
	entity_id: entityIdSchema,
});

export const attachmentCreateSchema = z.object({
	entity_type: attachmentEntityTypeSchema,
	entity_id: entityIdSchema,
	file_url: z.url(),
	file_name: z.string().min(1).max(255),
	file_size: z.number().int().nullish(),
	mime_type: z.string().max(100).default(""),
});

export type AttachmentEntityType = z.infer<typeof attachmentEntityTypeSchema>;
export type AttachmentListParams = z.infer<typeof attachmentListParamsSchema>;
export type AttachmentCreateInput = z.infer<typeof attachmentCreateSchema>;
export type AttachmentCreatePayload = z.input<typeof attachmentCreateSchema>;

export type AttachmentResponse = {
	id: number;
	entity_type: AttachmentEntityType;
	entity_id: number;
	file_url: string;
	file_name: string;
	file_size: number | null;
	mime_type: string;
	created_at: string;
};
