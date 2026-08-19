import type { EmailEntry, PhoneEntry } from "@/server/domains/locations/schema";

export type LocationFormValues = {
	name: string;
	address: string;
	city: string;
	state: string;
	postal_code: string;
	country: string;
	description: string;
	image_url: string;
	tag_ids: number[];
	phones: PhoneEntry[];
	emails: EmailEntry[];
	parent_location_id: number | null;
	business_id: number | null;
	latitude: number | null;
	longitude: number | null;
};

export const DEFAULT_CREATE_VALUES: LocationFormValues = {
	name: "",
	address: "",
	city: "",
	state: "",
	postal_code: "",
	country: "",
	description: "",
	image_url: "",
	tag_ids: [],
	phones: [],
	emails: [],
	parent_location_id: null,
	business_id: null,
	latitude: null,
	longitude: null,
};
