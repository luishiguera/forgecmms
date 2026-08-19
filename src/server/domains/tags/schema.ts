import { z } from "zod";
import { TAG_ENTITY_TYPES } from "../_shared/schema";

export const tagTypeSchema = z.enum(TAG_ENTITY_TYPES);

export const tagListParamsSchema = z.object({
	tag_type: tagTypeSchema,
});

export const tagCreateSchema = z.object({
	name: z.string().min(1).max(255),
	tag_type: tagTypeSchema,
});

export const tagUpdateSchema = z.object({
	name: z.string().min(1).max(255).optional(),
});

export type TagType = z.infer<typeof tagTypeSchema>;
export type TagListParams = z.infer<typeof tagListParamsSchema>;
export type TagCreateInput = z.infer<typeof tagCreateSchema>;
export type TagUpdateInput = z.infer<typeof tagUpdateSchema>;
