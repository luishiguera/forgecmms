import * as m from "@/paraglide/messages";
import type {
	AssetAssignmentStatus,
	AssetCriticality,
	AssetStatus,
} from "@/server/domains/assets/schema";

export type StatusValue =
	| "operational"
	| "needs_maintenance"
	| "retired"
	| "pending";

export function getStatusOptions() {
	return [
		{ value: "operational" as const, label: m.assets_status_operational() },
		{
			value: "needs_maintenance" as const,
			label: m.assets_status_needs_maintenance(),
		},
		{ value: "retired" as const, label: m.assets_status_retired() },
		{ value: "pending" as const, label: m.assets_status_pending() },
	];
}

export type CriticalityValue = "critical" | "important" | "normal";

export function getCriticalityOptions() {
	return [
		{ value: "critical" as const, label: m.assets_criticality_critical() },
		{ value: "important" as const, label: m.assets_criticality_important() },
		{ value: "normal" as const, label: m.assets_criticality_normal() },
	];
}

export type AssignmentStatusValue = "available" | "assigned" | "installed";

export function getAssignmentStatusOptions() {
	return [
		{ value: "available" as const, label: m.assets_assignment_available() },
		{ value: "assigned" as const, label: m.assets_assignment_assigned() },
		{ value: "installed" as const, label: m.assets_assignment_installed() },
	];
}

export interface AssetFormValues {
	name: string;
	serial_number: string;
	model: string;
	manufacturer: string;
	description: string;
	status: AssetStatus;
	criticality: AssetCriticality;
	assignment_status: AssetAssignmentStatus;
	image_url: string;
	tag_ids: number[];
	location_id: number | null;
	parent_asset_id: number | null;
}

export const DEFAULT_CREATE_VALUES: AssetFormValues = {
	name: "",
	serial_number: "",
	model: "",
	manufacturer: "",
	description: "",
	status: "operational",
	criticality: "normal",
	assignment_status: "available",
	image_url: "",
	tag_ids: [],
	location_id: null,
	parent_asset_id: null,
};

export type AssetFormMode = "create" | "edit";
