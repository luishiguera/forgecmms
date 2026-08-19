import { z } from "zod";
import type { Access } from "../organizations/schema";

const password = z.string().min(6).max(128);

export const signupSchema = z.object({
	email: z.email().max(255),
	password,
	full_name: z.string().min(1).max(300),
	photo_url: z.url().optional(),
	timezone: z.string().min(1),
});

export const loginSchema = z.object({
	email: z.email(),
	password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
	email: z.email(),
});

export const resetPasswordSchema = z.object({
	token: z.string().length(64),
	new_password: password,
});

export const changePasswordSchema = z.object({
	current_password: z.string().min(1),
	new_password: password,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type UserOrganizationResponse = {
	id: number;
	name: string;
	logo_url: string;
	accesses: Access[];
	is_owner: boolean;
};

export type SignupResponse = {
	organization_id: number;
};

export type LoginResponse = {
	user_id: number;
	organizations: UserOrganizationResponse[];
};
