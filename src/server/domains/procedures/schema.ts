import { z } from "zod";
import {
	entityIdSchema,
	paginationSchema,
	type TagResponse,
	tagIdsSchema,
} from "../_shared/schema";

export const procedureStatusSchema = z.enum(["draft", "active", "archived"]);

export const fieldTypeSchema = z.enum([
	"short_text",
	"long_text",
	"email",
	"phone",
	"link",
	"multiple_choice",
	"checkboxes",
	"multi_select",
	"number",
	"linear_scale",
	"rating",
	"date",
	"datetime",
	"matrix",
	"signature",
	"photo",
	"file",
	"toggle",
]);

export const embedTypeSchema = z.enum(["image", "video", "audio", "note"]);

export const noteVariantSchema = z.enum([
	"info",
	"warning",
	"success",
	"error",
]);

export const validationRuleSchema = z.object({
	type: z.enum([
		"required",
		"min",
		"max",
		"min_length",
		"max_length",
		"pattern",
		"email",
		"phone",
		"url",
		"custom",
	]),
	value: z.union([z.string(), z.number()]).optional(),
	message: z.string(),
});

export const conditionalRuleSchema = z.object({
	field_id: z.string(),
	operator: z.enum([
		"equals",
		"notEquals",
		"contains",
		"isEmpty",
		"isNotEmpty",
	]),
	value: z.string().optional(),
	action: z.enum(["show", "hide"]),
});

export const uploadConfigSchema = z.object({
	multiple: z.boolean(),
	max_files: z.number().int(),
	accepted_types: z.array(z.string()),
});

export const scaleConfigSchema = z.object({
	min: z.number(),
	max: z.number(),
	min_label: z.string().optional(),
	max_label: z.string().optional(),
});

export const ratingConfigSchema = z.object({
	max_rating: z.number().int(),
	icon: z.enum(["star", "heart", "thumb"]),
});

export const matrixConfigSchema = z.object({
	rows: z.array(z.string()),
	columns: z.array(z.string()),
	allow_multiple: z.boolean(),
});

export const textConfigSchema = z.object({
	max_length: z.number().int().optional(),
	min_rows: z.number().int().optional(),
	max_rows: z.number().int().optional(),
});

export const formFieldConfigSchema = z.object({
	id: z.string().min(1),
	type: fieldTypeSchema,
	label: z.string(),
	order: z.number().int().default(0),
	placeholder: z.string().optional(),
	help_text: z.string().optional(),
	default_value: z
		.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
		.optional(),
	options: z.array(z.string()).optional(),
	allow_other: z.boolean().optional(),
	photo_config: uploadConfigSchema.optional(),
	file_config: uploadConfigSchema.optional(),
	scale_config: scaleConfigSchema.optional(),
	rating_config: ratingConfigSchema.optional(),
	matrix_config: matrixConfigSchema.optional(),
	text_config: textConfigSchema.optional(),
	validation: z.array(validationRuleSchema).default([]),
	conditional_logic: conditionalRuleSchema.optional(),
});

export const embedConfigSchema = z.object({
	id: z.string().min(1),
	label: z.string(),
	type: embedTypeSchema,
	order: z.number().int().optional(),
	src: z.string(),
	alt: z.string(),
	caption: z.string(),
	noteVariant: noteVariantSchema.optional(),
	noteContent: z.string().optional(),
});

export const procedureBlockSchema = z.discriminatedUnion("nodeType", [
	formFieldConfigSchema.extend({ nodeType: z.literal("field") }),
	embedConfigSchema.extend({ nodeType: z.literal("embed") }),
]);

export const procedureFieldsSchema = z.array(procedureBlockSchema);

export const procedureSearchParamsSchema = paginationSchema.extend({
	q: z.string().optional(),
	status: procedureStatusSchema.optional(),
	tag_id: entityIdSchema.optional(),
});

export const procedureCreateSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().default(""),
	status: procedureStatusSchema,
	fields: procedureFieldsSchema,
	tag_ids: tagIdsSchema.optional(),
});

export const procedureUpdateSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	description: z.string().optional(),
	status: procedureStatusSchema.optional(),
	fields: procedureFieldsSchema.optional(),
});

export type FieldType = z.infer<typeof fieldTypeSchema>;
export type EmbedType = z.infer<typeof embedTypeSchema>;
export type NoteVariant = z.infer<typeof noteVariantSchema>;
export type ValidationRule = z.infer<typeof validationRuleSchema>;
export type ConditionalRule = z.infer<typeof conditionalRuleSchema>;
export type PhotoConfig = z.infer<typeof uploadConfigSchema>;
export type FileConfig = z.infer<typeof uploadConfigSchema>;
export type ScaleConfig = z.infer<typeof scaleConfigSchema>;
export type RatingConfig = z.infer<typeof ratingConfigSchema>;
export type MatrixConfig = z.infer<typeof matrixConfigSchema>;
export type TextConfig = z.infer<typeof textConfigSchema>;
export type FormFieldConfig = z.infer<typeof formFieldConfigSchema>;
export type EmbedConfig = z.infer<typeof embedConfigSchema>;

export type ProcedureBlock = z.infer<typeof procedureBlockSchema>;
export type ProcedureFieldBlock = Extract<
	ProcedureBlock,
	{ nodeType: "field" }
>;
export type ProcedureEmbedBlock = Extract<
	ProcedureBlock,
	{ nodeType: "embed" }
>;

export const isFieldBlock = (
	block: ProcedureBlock,
): block is ProcedureFieldBlock => block.nodeType === "field";

export const isEmbedBlock = (
	block: ProcedureBlock,
): block is ProcedureEmbedBlock => block.nodeType === "embed";

export type ProcedureStatus = z.infer<typeof procedureStatusSchema>;
export type ProcedureFields = z.infer<typeof procedureFieldsSchema>;
export type ProcedureSearchParams = z.infer<typeof procedureSearchParamsSchema>;
export type ProcedureCreateInput = z.infer<typeof procedureCreateSchema>;
export type ProcedureUpdateInput = z.infer<typeof procedureUpdateSchema>;

export type ProcedureSearchPayload = z.input<
	typeof procedureSearchParamsSchema
>;
export type ProcedureCreatePayload = z.input<typeof procedureCreateSchema>;
export type ProcedureUpdatePayload = z.input<typeof procedureUpdateSchema>;

export type ProcedureResponse = {
	id: number;
	name: string;
	description: string;
	status: ProcedureStatus;
	fields: ProcedureFields;
	uses_count: number;
	tags: TagResponse[];
	created_at: string;
	updated_at: string;
};
