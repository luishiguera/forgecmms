import type { Icon } from "@phosphor-icons/react";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { CircleIcon } from "@phosphor-icons/react/dist/csr/Circle";
import { CircleDashedIcon } from "@phosphor-icons/react/dist/csr/CircleDashed";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/csr/CircleNotch";
import { ClockIcon } from "@phosphor-icons/react/dist/csr/Clock";
import { ProhibitIcon } from "@phosphor-icons/react/dist/csr/Prohibit";
import { z } from "zod";
import * as m from "@/paraglide/messages";

export const workOrderStatusSchema = z.enum([
	"pending",
	"reviewing",
	"planned",
	"in_progress",
	"completed",
	"cancelled",
]);

export type WorkOrderStatus = z.infer<typeof workOrderStatusSchema>;

export const WORK_ORDER_STATUSES = workOrderStatusSchema.options;

export const STATUS_CONFIG: Record<
	WorkOrderStatus,
	{ icon: Icon; color: string }
> = {
	pending: { icon: CircleDashedIcon, color: "text-slate-400" },
	reviewing: { icon: CircleIcon, color: "text-amber-500" },
	planned: { icon: ClockIcon, color: "text-sky-500" },
	in_progress: { icon: CircleNotchIcon, color: "text-violet-500" },
	completed: { icon: CheckCircleIcon, color: "text-emerald-500" },
	cancelled: { icon: ProhibitIcon, color: "text-red-500" },
};

const STATUS_LABELS: Record<WorkOrderStatus, () => string> = {
	pending: m.wo_status_pending,
	reviewing: m.wo_status_reviewing,
	planned: m.wo_status_planned,
	in_progress: m.wo_status_in_progress,
	completed: m.wo_status_completed,
	cancelled: m.wo_status_cancelled,
};

export function getStatusLabel(status: WorkOrderStatus): string {
	return STATUS_LABELS[status]();
}

export function getStatusOptions() {
	return WORK_ORDER_STATUSES.map((status) => ({
		value: status,
		label: getStatusLabel(status),
	}));
}
