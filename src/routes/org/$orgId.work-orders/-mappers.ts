import type {
	WorkOrderResponse,
	WorkOrderUpdatePayload,
} from "@/server/domains/workorders/schema";
import type { WorkOrderFormValues } from "./-types";

export function mapWorkOrderToFormValues(
	workOrder: WorkOrderResponse,
): WorkOrderFormValues {
	return {
		title: workOrder.title,
		description: workOrder.description ?? "",
		status: workOrder.status,
		type: workOrder.type,
		priority: workOrder.priority,
		planned_start: workOrder.planned_start
			? new Date(workOrder.planned_start).toISOString().slice(0, 16)
			: "",
		planned_end: workOrder.planned_end
			? new Date(workOrder.planned_end).toISOString().slice(0, 16)
			: "",
		procedure_ids: workOrder.procedures?.map((p) => p.id) ?? [],
		recurrence_type: workOrder.recurrence_type,
		recurrence_config: workOrder.recurrence_config ?? {},
		tag_ids: workOrder.tags?.map((t) => t.id) ?? [],
		location_id: workOrder.location_id ?? null,
		asset_assignments:
			workOrder.assets?.map((a) => ({
				asset_id: a.id,
				procedure_ids: a.procedures?.map((p) => p.id) ?? [],
			})) ?? [],
		part_assignments:
			workOrder.parts?.map((p) => ({
				part_id: p.id,
				planned_quantity: p.planned_quantity,
			})) ?? [],
		assignee_ids:
			workOrder.assignees
				?.map((a) => a.id)
				.filter((id): id is number => id != null) ?? [],
	};
}

export function mapFormValuesToUpdateRequest(values: WorkOrderFormValues) {
	return {
		title: values.title,
		description: values.description || undefined,
		status: values.status,
		type: values.type,
		priority: values.priority,
		planned_start: values.planned_start || undefined,
		planned_end: values.planned_end || undefined,
		location_id: values.location_id ?? undefined,
		recurrence_type: values.recurrence_type,
		recurrence_config:
			Object.keys(values.recurrence_config).length > 0
				? values.recurrence_config
				: undefined,
	};
}

export function buildPartialUpdateRequest(
	values: WorkOrderFormValues,
	modifiedFields: Set<string>,
) {
	const request: WorkOrderUpdatePayload = {};

	if (modifiedFields.has("title") && values.title) {
		request.title = values.title;
	}
	if (modifiedFields.has("description")) {
		request.description = values.description || undefined;
	}
	if (modifiedFields.has("status")) {
		request.status = values.status;
	}
	if (modifiedFields.has("type")) {
		request.type = values.type;
	}
	if (modifiedFields.has("priority")) {
		request.priority = values.priority;
	}
	if (modifiedFields.has("planned_start")) {
		request.planned_start = values.planned_start || undefined;
	}
	if (modifiedFields.has("planned_end")) {
		request.planned_end = values.planned_end || undefined;
	}
	if (modifiedFields.has("location_id")) {
		request.location_id = values.location_id;
	}
	if (modifiedFields.has("recurrence_config")) {
		request.recurrence_config =
			Object.keys(values.recurrence_config).length > 0
				? values.recurrence_config
				: undefined;
	}

	return request;
}

export function mapFormValuesToCreateRequest(values: WorkOrderFormValues) {
	return {
		...mapFormValuesToUpdateRequest(values),
		tag_ids: values.tag_ids.length > 0 ? values.tag_ids : undefined,
		asset_assignments:
			values.asset_assignments.length > 0
				? values.asset_assignments
				: undefined,
		part_assignments:
			values.part_assignments.length > 0 ? values.part_assignments : undefined,
		assignee_ids:
			values.assignee_ids.length > 0 ? values.assignee_ids : undefined,
		procedure_ids:
			values.procedure_ids.length > 0 ? values.procedure_ids : undefined,
	};
}
