import { z } from "zod";
import { paginationSchema } from "../_shared/schema";
import { type Access, accessSchema } from "../organizations/schema";

export const invitationStatusSchema = z.enum([
	"pending",
	"accepted",
	"expired",
	"cancelled",
]);

export const invitationCreateSchema = z.object({
	email: z.email().max(255),
	full_name: z.string().min(1).max(300),
	accesses: z.array(accessSchema).min(1),
});

export const invitationSearchParamsSchema = paginationSchema.extend({
	status: invitationStatusSchema.optional(),
});

export const invitationTokenSchema = z.object({
	token: z.string().length(64),
});

export const invitationAcceptSchema = z.object({
	token: z.string().length(64),
	password: z.string().min(6).max(128).optional(),
});

export type InvitationStatus = z.infer<typeof invitationStatusSchema>;
export type InvitationCreateInput = z.infer<typeof invitationCreateSchema>;
export type InvitationSearchParams = z.infer<
	typeof invitationSearchParamsSchema
>;
export type InvitationSearchPayload = z.input<
	typeof invitationSearchParamsSchema
>;
export type InvitationAcceptInput = z.infer<typeof invitationAcceptSchema>;

export type InvitationResponse = {
	id: number;
	email: string;
	full_name: string;
	accesses: Access[];
	status: InvitationStatus;
	expires_at: string;
	created_at: string;
};

export type InvitationDetailsResponse = {
	organization_id: number;
	organization_name: string;
	organization_logo: string;
	email: string;
	full_name: string;
	accesses: Access[];
	user_exists: boolean;
};
