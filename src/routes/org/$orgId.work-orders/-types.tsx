import type {
	RecurrenceType,
	WorkOrderPriority,
	WorkOrderType,
} from "@/lib/work-orders/labels";
import {
	WORK_ORDER_STATUSES as ALL_STATUSES,
	getStatusLabel,
	getStatusOptions,
	type WorkOrderStatus,
} from "@/lib/work-orders/status";
import type {
	AssetAssignment,
	PartAssignment,
	RecurrenceConfigInput,
} from "@/server/domains/workorders/schema";

export { ALL_STATUSES, getStatusLabel, getStatusOptions, type WorkOrderStatus };

export interface WorkOrderFormValues {
	title: string;
	description: string;
	status: WorkOrderStatus;
	type: WorkOrderType;
	priority: WorkOrderPriority;
	planned_start: string;
	planned_end: string;
	procedure_ids: number[];
	recurrence_type: RecurrenceType;
	recurrence_config: RecurrenceConfigInput;
	tag_ids: number[];
	location_id: number | null;
	asset_assignments: AssetAssignment[];
	part_assignments: PartAssignment[];
	assignee_ids: number[];
}

export const DEFAULT_CREATE_VALUES: WorkOrderFormValues = {
	title: "",
	description: "",
	status: "pending",
	type: "reactive",
	priority: "medium",
	planned_start: "",
	planned_end: "",
	procedure_ids: [],
	recurrence_type: "none",
	recurrence_config: {},
	tag_ids: [],
	location_id: null,
	asset_assignments: [],
	part_assignments: [],
	assignee_ids: [],
};
