import type { FormFieldConfig } from "../../domains/procedures/schema";
import type { JsonValue } from "../../json";

export type ProcedureBlock = {
	name: string;
	assetName?: string;
	fields: FormFieldConfig[];
	responses: Record<string, JsonValue>;
};

export type LocationData = {
	name: string;
	address: string;
	city: string;
	state: string;
	postalCode: string;
	country: string;
};

export type OrgData = {
	name: string;
	legalName: string;
	taxId: string;
	address: string;
	city: string;
	state: string;
	postalCode: string;
	country: string;
	email: string;
	phone: string;
};

export type PartData = {
	name: string;
	sku: string;
	quantity: number;
	consumed: number;
};

export type AssetData = {
	name: string;
	serial: string;
	status: string;
	procedures: ProcedureBlock[];
};

export type WorkOrderData = {
	id: number;
	title: string;
	description: string;
	status: string;
	type: string;
	priority: string;
	plannedStart: string | null;
	plannedEnd: string | null;
	startedAt: string | null;
	closedAt: string | null;
	cancellationReason: string;
	location: LocationData | null;
	parts: PartData[];
	assets: AssetData[];
	assignees: string[];
	procedures: ProcedureBlock[];
};
