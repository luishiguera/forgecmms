import type { FormFieldConfig } from "@/components/procedure-builder/utils/types";
import {
	collectErrors,
	isEmpty,
	type Responses,
} from "@/components/procedure-runner/validation";
import * as m from "@/paraglide/messages";

export type ProcedureStatus =
	| "pending"
	| "in_progress"
	| "missing_required"
	| "completed";

export const procedureStatus = (
	fields: FormFieldConfig[],
	responses: Responses,
	isFlagged = false,
): ProcedureStatus => {
	const isAnswered = fields.some((field) => !isEmpty(responses[field.id]));
	if (!isAnswered) return isFlagged ? "missing_required" : "pending";

	const isComplete = Object.keys(collectErrors(fields, responses)).length === 0;
	if (isComplete) return "completed";
	return isFlagged ? "missing_required" : "in_progress";
};

const STATUS_LABELS: Record<ProcedureStatus, () => string> = {
	pending: m.wo_status_pending,
	in_progress: m.wo_status_in_progress,
	missing_required: m.wo_status_missing_required,
	completed: m.wo_status_completed,
};

export const procedureStatusLabel = (status: ProcedureStatus) =>
	STATUS_LABELS[status]();

export const PROCEDURE_STATUS_STYLE: Record<
	ProcedureStatus,
	{ ring: string; tab: string }
> = {
	pending: {
		ring: "ring-border",
		tab: "border-border bg-background text-muted-foreground",
	},
	in_progress: {
		ring: "ring-amber-600",
		tab: "border-amber-600 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
	},
	missing_required: {
		ring: "ring-red-700",
		tab: "border-red-700 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
	},
	completed: {
		ring: "ring-green-600",
		tab: "border-green-600 bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-300",
	},
};
