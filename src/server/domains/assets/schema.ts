import { z } from "zod";
import {
	entityIdSchema,
	optionalUrlSchema,
	paginationSchema,
	type TagResponse,
	tagIdsSchema,
} from "../_shared/schema";

export const assetStatusSchema = z.enum([
	"operational",
	"needs_maintenance",
	"retired",
	"pending",
]);
export const assetCriticalitySchema = z.enum([
	"critical",
	"important",
	"normal",
]);
export const assetAssignmentStatusSchema = z.enum([
	"available",
	"assigned",
	"installed",
]);

export const assetSearchParamsSchema = paginationSchema.extend({
	q: z.string().optional(),
	status: assetStatusSchema.optional(),
	criticality: assetCriticalitySchema.optional(),
	tag_id: entityIdSchema.optional(),
	location_id: entityIdSchema.optional(),
});

export const assetCreateSchema = z.object({
	parent_asset_id: entityIdSchema.nullish(),
	location_id: entityIdSchema.nullish(),
	serial_number: z.string().max(100).default(""),
	model: z.string().max(255).default(""),
	manufacturer: z.string().max(255).default(""),
	name: z.string().min(1).max(255),
	description: z.string().max(5000).default(""),
	status: assetStatusSchema,
	criticality: assetCriticalitySchema,
	assignment_status: assetAssignmentStatusSchema.optional(),
	image_url: optionalUrlSchema.default(""),
	tag_ids: tagIdsSchema.optional(),
});

export const assetUpdateSchema = z.object({
	serial_number: z.string().max(100).optional(),
	model: z.string().max(255).optional(),
	manufacturer: z.string().max(255).optional(),
	name: z.string().min(1).max(255).optional(),
	description: z.string().max(5000).optional(),
	status: assetStatusSchema.optional(),
	criticality: assetCriticalitySchema.optional(),
	assignment_status: assetAssignmentStatusSchema.optional(),
	image_url: optionalUrlSchema.optional(),
	location_id: entityIdSchema.nullable().optional(),
	parent_asset_id: entityIdSchema.nullable().optional(),
});

export type AssetStatus = z.infer<typeof assetStatusSchema>;
export type AssetCriticality = z.infer<typeof assetCriticalitySchema>;
export type AssetAssignmentStatus = z.infer<typeof assetAssignmentStatusSchema>;
export type AssetSearchParams = z.infer<typeof assetSearchParamsSchema>;
export type AssetCreateInput = z.infer<typeof assetCreateSchema>;
export type AssetUpdateInput = z.infer<typeof assetUpdateSchema>;

export type AssetSearchPayload = z.input<typeof assetSearchParamsSchema>;
export type AssetCreatePayload = z.input<typeof assetCreateSchema>;
export type AssetUpdatePayload = z.input<typeof assetUpdateSchema>;

export type AssetLocationResponse = {
	id: number;
	name: string;
	address: string;
	image_url: string;
};

export type AssetResponse = {
	id: number;
	parent_asset_id: number | null;
	location_id: number | null;
	serial_number: string;
	model: string;
	manufacturer: string;
	name: string;
	description: string;
	status: AssetStatus;
	criticality: AssetCriticality;
	assignment_status: AssetAssignmentStatus;
	image_url: string;
	tags: TagResponse[];
	location: AssetLocationResponse | null;
	created_at: string;
};
