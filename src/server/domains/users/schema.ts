import { z } from "zod";

export const languageSchema = z.enum(["en-US", "pt-BR", "es"]);

export const userUpdateSchema = z.object({
	full_name: z.string().min(1).max(300).optional(),
	photo_url: z.url().optional(),
	language: languageSchema.optional(),
	timezone: z.string().min(1).optional(),
});

export type Language = z.infer<typeof languageSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export type UserResponse = {
	id: number;
	email: string;
	full_name: string;
	photo_url: string;
	language: string;
	timezone: string;
	created_at: string;
};
