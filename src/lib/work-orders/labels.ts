import { z } from "zod";
import * as m from "@/paraglide/messages";

export const workOrderPrioritySchema = z.enum([
	"low",
	"medium",
	"high",
	"urgent",
]);

export const workOrderTypeSchema = z.enum(["reactive", "preventive", "other"]);

export const recurrenceTypeSchema = z.enum([
	"none",
	"daily",
	"weekly",
	"monthly_by_date",
	"monthly_by_weekday",
	"yearly",
]);

export type WorkOrderPriority = z.infer<typeof workOrderPrioritySchema>;
export type WorkOrderType = z.infer<typeof workOrderTypeSchema>;
export type RecurrenceType = z.infer<typeof recurrenceTypeSchema>;

export const WORK_ORDER_PRIORITIES = workOrderPrioritySchema.options;
export const WORK_ORDER_TYPES = workOrderTypeSchema.options;

const PRIORITY_LABELS: Record<WorkOrderPriority, () => string> = {
	low: m.wo_priority_low,
	medium: m.wo_priority_medium,
	high: m.wo_priority_high,
	urgent: m.wo_priority_urgent,
};

const TYPE_LABELS: Record<WorkOrderType, () => string> = {
	reactive: m.wo_type_reactive,
	preventive: m.wo_type_preventive,
	other: m.wo_type_other,
};

const RECURRENCE_LABELS: Record<RecurrenceType, () => string> = {
	none: m.wo_recurrence_none,
	daily: m.wo_recurrence_daily,
	weekly: m.wo_recurrence_weekly,
	monthly_by_date: m.wo_recurrence_monthly_by_date,
	monthly_by_weekday: m.wo_recurrence_monthly_by_weekday,
	yearly: m.wo_recurrence_yearly,
};

export function getPriorityLabel(priority: WorkOrderPriority): string {
	return PRIORITY_LABELS[priority]();
}

export function getTypeLabel(type: WorkOrderType): string {
	return TYPE_LABELS[type]();
}

export function getRecurrenceLabel(recurrence: RecurrenceType): string {
	return RECURRENCE_LABELS[recurrence]();
}

export function getPriorityOptions() {
	return WORK_ORDER_PRIORITIES.map((priority) => ({
		value: priority,
		label: getPriorityLabel(priority),
	}));
}

export function getTypeOptions() {
	return WORK_ORDER_TYPES.map((type) => ({
		value: type,
		label: getTypeLabel(type),
	}));
}
