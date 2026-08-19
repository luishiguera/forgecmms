import type { Icon } from "@phosphor-icons/react";
import { CalendarXIcon } from "@phosphor-icons/react/dist/csr/CalendarX";
import { CarIcon } from "@phosphor-icons/react/dist/csr/Car";
import { ClipboardTextIcon } from "@phosphor-icons/react/dist/csr/ClipboardText";
import { CoffeeIcon } from "@phosphor-icons/react/dist/csr/Coffee";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/csr/UsersThree";
import type { WorkOrderPriority } from "@/lib/work-orders/labels";
import type { WorkOrderStatus } from "@/lib/work-orders/status";
import * as m from "@/paraglide/messages";
import type { ScheduleBlockResponse } from "@/server/domains/schedule/schema";
import type { WorkOrderResponse } from "@/server/domains/workorders/schema";

export type AgendaBlockType =
	| "work_order"
	| "break"
	| "travel"
	| "meeting"
	| "block";

export type AgendaBlock = {
	id: number;
	type: AgendaBlockType;
	title: string;
	start: Date;
	end: Date;
	status?: WorkOrderStatus;
	priority?: WorkOrderPriority;
	description?: string;
	locationName?: string;
	locationAddress?: string;
	assetName?: string;
	assignee?: string;
	tags: string[];
	actualStart?: Date;
	actualEnd?: Date;
};

export const BLOCK_TYPE_CONFIG: Record<
	AgendaBlockType,
	{ icon: Icon; accent: string; rail: string; tint: string }
> = {
	work_order: {
		icon: ClipboardTextIcon,
		accent: "text-primary",
		rail: "bg-primary",
		tint: "bg-muted",
	},
	break: {
		icon: CoffeeIcon,
		accent: "text-orange-600",
		rail: "bg-orange-600",
		tint: "bg-orange-50 dark:bg-orange-950/40",
	},
	travel: {
		icon: CarIcon,
		accent: "text-sky-600",
		rail: "bg-sky-600",
		tint: "bg-sky-100 dark:bg-sky-950/40",
	},
	meeting: {
		icon: UsersThreeIcon,
		accent: "text-violet-600",
		rail: "bg-violet-600",
		tint: "bg-violet-100 dark:bg-violet-950/40",
	},
	block: {
		icon: CalendarXIcon,
		accent: "text-slate-600",
		rail: "bg-slate-600",
		tint: "bg-slate-100 dark:bg-slate-900/60",
	},
};

const STATUS_RAIL: Record<WorkOrderStatus, string> = {
	pending: "bg-slate-600",
	reviewing: "bg-amber-600",
	planned: "bg-sky-600",
	in_progress: "bg-violet-600",
	completed: "bg-green-600",
	cancelled: "bg-red-700",
};

export const railColor = (block: AgendaBlock) =>
	block.status ? STATUS_RAIL[block.status] : BLOCK_TYPE_CONFIG[block.type].rail;

const BLOCK_TYPE_LABELS: Record<
	Exclude<AgendaBlockType, "work_order">,
	() => string
> = {
	break: m.agenda_type_break,
	travel: m.agenda_type_travel,
	meeting: m.agenda_type_meeting,
	block: m.agenda_type_block,
};

export const blockTypeLabel = (type: AgendaBlockType) =>
	type === "work_order"
		? m.agenda_type_work_order()
		: BLOCK_TYPE_LABELS[type]();

const isBlockType = (
	value: string,
): value is Exclude<AgendaBlockType, "work_order"> =>
	value === "break" ||
	value === "travel" ||
	value === "meeting" ||
	value === "block";

export const fromWorkOrder = (
	workOrder: WorkOrderResponse,
): AgendaBlock | null => {
	if (!workOrder.planned_start) return null;
	const start = new Date(workOrder.planned_start);
	const end = workOrder.planned_end
		? new Date(workOrder.planned_end)
		: new Date(start.getTime() + 3_600_000);

	return {
		id: workOrder.id,
		type: "work_order",
		title: workOrder.title,
		start,
		end,
		status: workOrder.status,
		priority: workOrder.priority,
		description: workOrder.description || undefined,
		locationName: workOrder.location?.name || undefined,
		locationAddress: workOrder.location?.address || undefined,
		assetName: workOrder.assets[0]?.name,
		assignee: workOrder.assignees[0]?.full_name,
		tags: workOrder.tags.map((tag) => tag.name),
		actualStart: workOrder.started_at
			? new Date(workOrder.started_at)
			: undefined,
		actualEnd: workOrder.closed_at ? new Date(workOrder.closed_at) : undefined,
	};
};

export const fromScheduleBlock = (
	block: ScheduleBlockResponse,
): AgendaBlock => {
	const type = isBlockType(block.type) ? block.type : "block";
	return {
		id: block.id,
		type,
		title: block.note.trim() || blockTypeLabel(type),
		start: new Date(block.start_time),
		end: new Date(block.end_time),
		tags: [],
	};
};

export const durationMinutes = (block: AgendaBlock) =>
	Math.max(
		0,
		Math.round((block.end.getTime() - block.start.getTime()) / 60_000),
	);

export type AgendaFilter = {
	assigned: boolean;
	status?: WorkOrderStatus;
};

export const hasActiveFilters = (filter: AgendaFilter) =>
	!filter.assigned || !!filter.status;
