import { z } from "zod";
import type { WorkingDay } from "../../db/schema";
import { paginationSchema } from "../_shared/schema";

export const accessSchema = z.enum(["backoffice", "field"]);

export const workingDaySchema = z.object({
	weekday: z.number().int().min(0).max(6),
	enabled: z.boolean(),
	from: z.string().regex(/^\d{2}:\d{2}$/),
	to: z.string().regex(/^\d{2}:\d{2}$/),
});

export const organizationCreateSchema = z.object({
	name: z.string().min(1).max(255),
	logo_url: z.url().optional(),
});

export const organizationUpdateSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	logo_url: z.url().optional(),
	legal_name: z.string().max(255).optional(),
	tax_id: z.string().max(64).optional(),
	address: z.string().max(255).optional(),
	city: z.string().max(128).optional(),
	state: z.string().max(128).optional(),
	postal_code: z.string().max(32).optional(),
	country: z.string().max(128).optional(),
	email: z.union([z.literal(""), z.email().max(255)]).optional(),
	phone: z.string().max(64).optional(),
});

export const memberSearchParamsSchema = paginationSchema.extend({
	q: z.string().optional(),
	access: accessSchema.optional(),
});

export const memberUpdateSchema = z.object({
	accesses: z.array(accessSchema).min(1).optional(),
	working_hours: z.array(workingDaySchema).optional(),
});

export type Access = z.infer<typeof accessSchema>;
export type OrganizationCreateInput = z.infer<typeof organizationCreateSchema>;
export type OrganizationUpdateInput = z.infer<typeof organizationUpdateSchema>;
export type MemberSearchParams = z.infer<typeof memberSearchParamsSchema>;
export type MemberSearchPayload = z.input<typeof memberSearchParamsSchema>;
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;

export type OrganizationResponse = {
	id: number;
	name: string;
	logo_url: string;
	legal_name: string;
	tax_id: string;
	address: string;
	city: string;
	state: string;
	postal_code: string;
	country: string;
	email: string;
	phone: string;
	accesses: Access[];
	is_owner: boolean;
	created_at: string;
};

export type MemberResponse = {
	user_id: number;
	full_name: string;
	photo_url: string;
	email: string;
	accesses: Access[];
	working_hours: WorkingDay[];
	is_owner: boolean;
	created_at: string;
};
