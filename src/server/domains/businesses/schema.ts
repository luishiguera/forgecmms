import { z } from "zod";
import type { EmailEntry, PhoneEntry } from "../../db/schema";
import { optionalUrlSchema, paginationSchema } from "../_shared/schema";
import { emailEntrySchema, phoneEntrySchema } from "../locations/schema";

export type { EmailEntry, PhoneEntry };

export const businessTypeSchema = z.enum(["customer", "vendor", "both"]);

export const businessSearchParamsSchema = paginationSchema.extend({
	q: z.string().optional(),
	type: businessTypeSchema.optional(),
});

export const businessCreateSchema = z.object({
	name: z.string().min(1).max(255),
	tax_id: z.string().max(50).default(""),
	type: businessTypeSchema.default("customer"),
	description: z.string().max(5000).default(""),
	image_url: optionalUrlSchema.default(""),
	phones: z.array(phoneEntrySchema).default([]),
	emails: z.array(emailEntrySchema).default([]),
});

export const businessUpdateSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	tax_id: z.string().max(50).optional(),
	type: businessTypeSchema.optional(),
	description: z.string().max(5000).optional(),
	image_url: optionalUrlSchema.optional(),
	phones: z.array(phoneEntrySchema).optional(),
	emails: z.array(emailEntrySchema).optional(),
});

export type BusinessType = z.infer<typeof businessTypeSchema>;
export type BusinessSearchParams = z.infer<typeof businessSearchParamsSchema>;
export type BusinessCreateInput = z.infer<typeof businessCreateSchema>;
export type BusinessUpdateInput = z.infer<typeof businessUpdateSchema>;

export type BusinessSearchPayload = z.input<typeof businessSearchParamsSchema>;
export type BusinessCreatePayload = z.input<typeof businessCreateSchema>;
export type BusinessUpdatePayload = z.input<typeof businessUpdateSchema>;

export type BusinessLocationItemResponse = {
	id: number;
	name: string;
	address: string;
	image_url: string;
};

export type BusinessResponse = {
	id: number;
	name: string;
	tax_id: string;
	type: BusinessType;
	description: string;
	image_url: string;
	phones: PhoneEntry[];
	emails: EmailEntry[];
	created_at: string;
	locations: BusinessLocationItemResponse[];
};
