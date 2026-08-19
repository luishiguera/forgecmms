import { randomBytes } from "node:crypto";
import {
	deleteCookie,
	getCookie,
	getRequestHeader,
	getRequestProtocol,
	setCookie,
} from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { tokens } from "../db/schema";

export const SESSION_COOKIE = "session_token";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const RESET_TOKEN_DURATION_MS = 60 * 60 * 1000;

export const generateToken = () => randomBytes(32).toString("hex");

const cookieOptions = () => {
	const secure = getRequestProtocol() === "https";
	return {
		path: "/",
		httpOnly: true,
		secure,
		sameSite: "lax" as const,
	};
};

export const setSessionCookie = (token: string) => {
	setCookie(SESSION_COOKIE, token, {
		...cookieOptions(),
		expires: new Date(Date.now() + SESSION_DURATION_MS),
	});
};

export const clearSessionCookie = () => {
	deleteCookie(SESSION_COOKIE, cookieOptions());
};

export const readSessionToken = () => {
	const cookie = getCookie(SESSION_COOKIE);
	if (cookie) return cookie;
	const header = getRequestHeader("authorization");
	return header?.startsWith("Bearer ") ? header.slice(7) : undefined;
};

export const createSession = async (userId: number) => {
	const token = generateToken();
	await db.insert(tokens).values({
		token,
		userId,
		tokenType: "session",
		expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
	});
	return token;
};

export const resolveSession = async (token: string) => {
	const [row] = await db
		.select({
			userId: tokens.userId,
			expiresAt: tokens.expiresAt,
		})
		.from(tokens)
		.where(and(eq(tokens.token, token), eq(tokens.tokenType, "session")))
		.limit(1);

	if (!row) return undefined;
	if (row.expiresAt.getTime() <= Date.now()) return undefined;
	return row;
};

export const destroySession = async (token: string) => {
	await db.delete(tokens).where(eq(tokens.token, token));
};
