import { cn } from "@/lib/utils";
import {
	getPriorityLabel,
	type WorkOrderPriority,
} from "@/lib/work-orders/labels";
import { getStatusLabel, type WorkOrderStatus } from "@/lib/work-orders/status";

const BADGE =
	"inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium leading-none";

const STATUS_TINT: Record<WorkOrderStatus, string> = {
	pending:
		"bg-slate-100 text-slate-600 dark:bg-slate-900/60 dark:text-slate-300",
	reviewing:
		"bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
	planned: "bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300",
	in_progress:
		"bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300",
	completed:
		"bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-300",
	cancelled: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

const PRIORITY_TINT: Record<WorkOrderPriority, string> = {
	low: "bg-slate-100 text-slate-600 dark:bg-slate-900/60 dark:text-slate-300",
	medium: "bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300",
	high: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
	urgent: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export function StatusBadge({ status }: { status: WorkOrderStatus }) {
	return (
		<span className={cn(BADGE, STATUS_TINT[status])}>
			{getStatusLabel(status)}
		</span>
	);
}

export function PriorityBadge({ priority }: { priority: WorkOrderPriority }) {
	return (
		<span className={cn(BADGE, PRIORITY_TINT[priority])}>
			{getPriorityLabel(priority)}
		</span>
	);
}
