import type {
	EmailEntry,
	PhoneEntry,
} from "@/server/domains/businesses/schema";

export type BusinessType = "customer" | "vendor" | "both";

export interface BusinessFormValues {
	name: string;
	tax_id: string;
	type: BusinessType;
	description: string;
	image_url: string;
	phones: PhoneEntry[];
	emails: EmailEntry[];
}

export const DEFAULT_CREATE_VALUES: BusinessFormValues = {
	name: "",
	tax_id: "",
	type: "customer",
	description: "",
	image_url: "",
	phones: [],
	emails: [],
};
