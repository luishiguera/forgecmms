import { and, eq } from "drizzle-orm";
import { db, type IDB } from "../db/client";
import { tokens } from "../db/schema";

export type TokenType = "session" | "reset_password";

export const create = async (
	token: string,
	userId: number,
	tokenType: TokenType,
	expiresAt: Date,
	dbc: IDB = db,
) => {
	await dbc.insert(tokens).values({ token, userId, tokenType, expiresAt });
};

export const getByToken = async (token: string, dbc: IDB = db) => {
	const [row] = await dbc
		.select({
			userId: tokens.userId,
			tokenType: tokens.tokenType,
			expiresAt: tokens.expiresAt,
		})
		.from(tokens)
		.where(eq(tokens.token, token))
		.limit(1);

	return row;
};

export const deleteByToken = async (token: string, dbc: IDB = db) => {
	await dbc.delete(tokens).where(eq(tokens.token, token));
};

export const deleteByUserAndType = async (
	userId: number,
	tokenType: TokenType,
	dbc: IDB = db,
) => {
	await dbc
		.delete(tokens)
		.where(and(eq(tokens.userId, userId), eq(tokens.tokenType, tokenType)));
};
