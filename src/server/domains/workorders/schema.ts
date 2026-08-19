import { z } from "zod";
import type {
	EmailEntry,
	PhoneEntry,
	ProcedureResponses,
	RecurrenceConfig,
} from "../../db/schema";
import {
	entityIdSchema,
	jsonValueSchema,
	paginationSchema,
	type TagResponse,
	tagIdsSchema,
	timestampSchema,
} from "../_shared/schema";

export type { ProcedureResponses, RecurrenceConfig };

export const workOrderStatusSchema = z.enum([
	"pending",
	"reviewing",
	"planned",
	"in_progress",
	"completed",
	"cancelled",
]);

export const workOrderTypeSchema = z.enum(["reactive", "preventive", "other"]);

export const workOrderPrioritySchema = z.enum([
	"low",
	"medium",
	"high",
	"urgent",
]);

export const recurrenceTypeSchema = z.enum([
	"none",
	"daily",
	"weekly",
	"monthly_by_date",
	"monthly_by_weekday",
	"yearly",
]);

export const recurrenceConfigSchema = z.object({
	interval: z.number().int().default(0),
	days_of_week: z.array(z.number().int()).nullish(),
	day_of_month: z.number().int().default(0),
	week_of_month: z.number().int().default(0),
	month_of_year: z.number().int().default(0),
	end_date: z.string().nullish(),
	max_occurrences: z.number().int().nullish(),
});

export const procedureResponsesSchema = z.record(z.string(), jsonValueSchema);

const dateOnlySchema = z.iso.date();

export const workOrderSearchParamsSchema = paginationSchema.extend({
	q: z.string().optional(),
	status: workOrderStatusSchema.optional(),
	type: workOrderTypeSchema.optional(),
	priority: workOrderPrioritySchema.optional(),
	tag_id: entityIdSchema.optional(),
	location_id: entityIdSchema.optional(),
	asset_id: entityIdSchema.optional(),
	part_id: entityIdSchema.optional(),
	assignee_id: entityIdSchema.optional(),
	assignment: z.enum(["assigned", "unassigned"]).optional(),
	planned_start_from: dateOnlySchema.optional(),
	planned_start_to: dateOnlySchema.optional(),
});

export const assetAssignmentSchema = z.object({
	asset_id: entityIdSchema,
	procedure_ids: z.array(entityIdSchema).optional(),
});

export const partAssignmentSchema = z.object({
	part_id: entityIdSchema,
	planned_quantity: z.number().int().min(1),
});

export const workOrderCreateSchema = z.object({
	title: z.string().min(1).max(255),
	description: z.string().max(10000).default(""),
	status: workOrderStatusSchema,
	type: workOrderTypeSchema,
	priority: workOrderPrioritySchema,
	planned_start: timestampSchema.nullish(),
	planned_end: timestampSchema.nullish(),
	recurrence_type: recurrenceTypeSchema,
	recurrence_config: recurrenceConfigSchema.optional(),
	location_id: entityIdSchema.nullish(),
	tag_ids: tagIdsSchema.optional(),
	asset_assignments: z.array(assetAssignmentSchema).optional(),
	part_assignments: z.array(partAssignmentSchema).optional(),
	assignee_ids: z.array(entityIdSchema).optional(),
	procedure_ids: z.array(entityIdSchema).optional(),
});

export const workOrderUpdateSchema = z.object({
	title: z.string().min(1).max(255).optional(),
	description: z.string().max(10000).optional(),
	status: workOrderStatusSchema.optional(),
	type: workOrderTypeSchema.optional(),
	priority: workOrderPrioritySchema.optional(),
	planned_start: timestampSchema.optional(),
	planned_end: timestampSchema.optional(),
	cancellation_reason: z.string().max(2000).optional(),
	location_id: entityIdSchema.nullable().optional(),
	recurrence_type: recurrenceTypeSchema.optional(),
	recurrence_config: recurrenceConfigSchema.optional(),
});

export const workOrderPartCreateSchema = z.object({
	planned_quantity: z.number().int().min(1),
});

export const workOrderPartUpdateSchema = z.object({
	planned_quantity: z.number().int().min(1),
	used_quantity: z.number().int().min(0),
});

export const workOrderProcedureResponsesSchema = z.object({
	procedure_responses: procedureResponsesSchema,
});

export type WorkOrderStatus = z.infer<typeof workOrderStatusSchema>;
export type WorkOrderType = z.infer<typeof workOrderTypeSchema>;
export type WorkOrderPriority = z.infer<typeof workOrderPrioritySchema>;
export type RecurrenceType = z.infer<typeof recurrenceTypeSchema>;
export type WorkOrderSearchParams = z.infer<typeof workOrderSearchParamsSchema>;
export type WorkOrderCreateInput = z.infer<typeof workOrderCreateSchema>;
export type WorkOrderUpdateInput = z.infer<typeof workOrderUpdateSchema>;

export type AssetAssignment = z.infer<typeof assetAssignmentSchema>;
export type PartAssignment = z.infer<typeof partAssignmentSchema>;
export type RecurrenceConfigInput = z.input<typeof recurrenceConfigSchema>;

export type WorkOrderSearchPayload = z.input<
	typeof workOrderSearchParamsSchema
>;
export type WorkOrderCreatePayload = z.input<typeof workOrderCreateSchema>;
export type WorkOrderUpdatePayload = z.input<typeof workOrderUpdateSchema>;

export type WorkOrderBusinessItemResponse = {
	id: number;
	name: string;
	type: string;
	phones: PhoneEntry[];
	emails: EmailEntry[];
};

export type WorkOrderLocationItemResponse = {
	id: number;
	name: string;
	address: string;
	image_url: string;
	latitude: number | null;
	longitude: number | null;
	phones: PhoneEntry[];
	business: WorkOrderBusinessItemResponse | null;
};

export type WorkOrderProcedureItemResponse = {
	id: number;
	name: string;
	description: string;
	procedure_responses: ProcedureResponses;
};

export type WorkOrderAssetItemResponse = {
	id: number;
	name: string;
	serial_number: string;
	image_url: string;
	status: string;
	criticality: string;
	location_id: number | null;
	assignment_status: string;
	procedures: WorkOrderProcedureItemResponse[];
};

export type WorkOrderPartItemResponse = {
	id: number;
	name: string;
	sku: string;
	image_url: string;
	planned_quantity: number;
	used_quantity: number;
};

export type WorkOrderUserItemResponse = {
	id: number;
	full_name: string;
	photo_url: string;
	email: string;
};

export type WorkOrderResponse = {
	id: number;
	title: string;
	description: string;
	status: WorkOrderStatus;
	type: WorkOrderType;
	priority: WorkOrderPriority;
	planned_start: string | null;
	planned_end: string | null;
	started_at: string | null;
	closed_at: string | null;
	cancellation_reason: string;
	location_id: number | null;
	location: WorkOrderLocationItemResponse | null;
	recurrence_type: RecurrenceType;
	recurrence_config: RecurrenceConfig;
	parent_work_order_id: number | null;
	report_url: string | null;
	report_generated_at: string | null;
	created_at: string;
	updated_at: string;
	tags: TagResponse[];
	assets: WorkOrderAssetItemResponse[];
	parts: WorkOrderPartItemResponse[];
	assignees: WorkOrderUserItemResponse[];
	procedures: WorkOrderProcedureItemResponse[];
};
