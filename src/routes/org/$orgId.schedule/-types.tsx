import {
	differenceInDays,
	differenceInHours,
	differenceInMinutes,
} from "date-fns";
import { z } from "zod";
import { PRIORITY_CONFIG } from "@/components/shared/work-order-list-item";
import type {
	ScheduleBlock,
	ScheduleBlockType,
	WorkOrder,
} from "@/components/ui/schedule-timeline";
import { getPriorityLabel } from "@/lib/work-orders/labels";
import {
	getStatusLabel,
	STATUS_CONFIG,
	WORK_ORDER_STATUSES,
	type WorkOrderStatus,
	workOrderStatusSchema,
} from "@/lib/work-orders/status";
import * as m from "@/paraglide/messages";
import type { ScheduleBlockResponse } from "@/server/domains/schedule/schema";
import type { WorkOrderResponse } from "@/server/domains/workorders/schema";

export {
	getPriorityLabel,
	getStatusLabel,
	PRIORITY_CONFIG,
	STATUS_CONFIG,
	WORK_ORDER_STATUSES,
	type WorkOrderStatus,
	workOrderStatusSchema,
};

export type SelectionType = "member" | "wo";

export type LayerKey = "workOrders" | "members";

export const queueAssignmentSchema = z.enum(["unassigned", "assigned"]);

export type QueueAssignment = z.infer<typeof queueAssignmentSchema>;

export const QUEUE_ASSIGNMENT_OPTIONS: (QueueAssignment | undefined)[] = [
	undefined,
	"unassigned",
	"assigned",
];

export function getQueueAssignmentLabel(
	value: QueueAssignment | undefined,
): string {
	if (value === "assigned") return m.schedule_queue_assigned();
	if (value === "unassigned") return m.schedule_queue_unassigned();
	return m.schedule_queue_all();
}

const STATUS_MARKER_COLOR: Record<string, string> = {
	pending: "bg-slate-400",
	reviewing: "bg-amber-500",
	planned: "bg-sky-500",
	in_progress: "bg-violet-500",
	completed: "bg-emerald-500",
	cancelled: "bg-red-500",
};

export function statusMarkerColor(status: string): string {
	return STATUS_MARKER_COLOR[status] ?? "bg-sky-500";
}

export function toTimelineWorkOrder(
	wo: WorkOrderResponse,
	memberId: number,
): WorkOrder {
	return {
		id: wo.id,
		public_id: wo.id,
		title: wo.title,
		customer_name: "",
		location: wo.location?.name ?? "",
		start_time: wo.planned_start ? new Date(wo.planned_start) : new Date(),
		end_time: wo.planned_end ? new Date(wo.planned_end) : new Date(),
		status: (wo.status === "cancelled"
			? "closed"
			: wo.status) as WorkOrder["status"],
		priority: wo.priority as WorkOrder["priority"],
		member_id: memberId,
	};
}

function isScheduleBlockType(
	value: string | undefined,
): value is ScheduleBlockType {
	return (
		value === "break" ||
		value === "travel" ||
		value === "meeting" ||
		value === "block"
	);
}

export function toTimelineBlock(
	block: ScheduleBlockResponse,
): ScheduleBlock | null {
	if (
		block.id == null ||
		block.user_id == null ||
		!block.start_time ||
		!block.end_time
	) {
		return null;
	}
	return {
		id: block.id,
		type: isScheduleBlockType(block.type) ? block.type : "block",
		start_time: new Date(block.start_time),
		end_time: new Date(block.end_time),
		member_id: block.user_id,
		note: block.note,
	};
}

export function formatAge(createdAt: string): string {
	const now = new Date();
	const date = new Date(createdAt);
	const days = differenceInDays(now, date);
	if (days >= 1) return `${days}d`;
	const hours = differenceInHours(now, date);
	if (hours >= 1) return `${hours}h`;
	const minutes = Math.max(1, differenceInMinutes(now, date));
	return `${minutes}m`;
}
