import { z } from "zod";
import type { EmailEntry, PhoneEntry } from "../../db/schema";
import {
	entityIdSchema,
	optionalUrlSchema,
	paginationSchema,
	type TagResponse,
	tagIdsSchema,
} from "../_shared/schema";

export type { EmailEntry, PhoneEntry };

export const phoneEntrySchema = z.object({ number: z.string().max(50) });
export const emailEntrySchema = z.object({ address: z.string().max(255) });

const latitude = z.number().min(-90).max(90);
const longitude = z.number().min(-180).max(180);

export const locationSearchParamsSchema = paginationSchema.extend({
	q: z.string().optional(),
	tag_id: entityIdSchema.optional(),
});

export const locationCreateSchema = z.object({
	name: z.string().min(1).max(255),
	parent_location_id: entityIdSchema.nullish(),
	business_id: entityIdSchema.nullish(),
	address: z.string().max(500).default(""),
	city: z.string().max(128).default(""),
	state: z.string().max(128).default(""),
	postal_code: z.string().max(32).default(""),
	country: z.string().max(128).default(""),
	description: z.string().max(5000).default(""),
	image_url: optionalUrlSchema.default(""),
	latitude: latitude.nullish(),
	longitude: longitude.nullish(),
	tag_ids: tagIdsSchema.optional(),
	phones: z.array(phoneEntrySchema).default([]),
	emails: z.array(emailEntrySchema).default([]),
});

export const locationUpdateSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	parent_location_id: entityIdSchema.optional(),
	business_id: entityIdSchema.nullable().optional(),
	address: z.string().max(500).optional(),
	city: z.string().max(128).optional(),
	state: z.string().max(128).optional(),
	postal_code: z.string().max(32).optional(),
	country: z.string().max(128).optional(),
	description: z.string().max(5000).optional(),
	image_url: optionalUrlSchema.optional(),
	latitude: latitude.optional(),
	longitude: longitude.optional(),
	phones: z.array(phoneEntrySchema).optional(),
	emails: z.array(emailEntrySchema).optional(),
});

export type LocationSearchParams = z.infer<typeof locationSearchParamsSchema>;
export type LocationCreateInput = z.infer<typeof locationCreateSchema>;
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;

export type LocationSearchPayload = z.input<typeof locationSearchParamsSchema>;
export type LocationCreatePayload = z.input<typeof locationCreateSchema>;
export type LocationUpdatePayload = z.input<typeof locationUpdateSchema>;

export type LocationAssetItemResponse = {
	id: number;
	name: string;
	serial_number: string;
	image_url: string;
	status: string;
	criticality: string;
	location_id: number | null;
	assignment_status: string;
};

export type LocationBusinessItemResponse = {
	id: number;
	name: string;
	type: string;
	image_url: string;
	phones: PhoneEntry[];
	emails: EmailEntry[];
};

export type LocationResponse = {
	id: number;
	parent_location_id: number | null;
	business_id: number | null;
	name: string;
	address: string;
	city: string;
	state: string;
	postal_code: string;
	country: string;
	description: string;
	image_url: string;
	latitude: number | null;
	longitude: number | null;
	phones: PhoneEntry[];
	emails: EmailEntry[];
	created_at: string;
	tags: TagResponse[];
	assets: LocationAssetItemResponse[];
	business: LocationBusinessItemResponse | null;
};
