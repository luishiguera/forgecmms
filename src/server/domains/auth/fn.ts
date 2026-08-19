import { createServerFn } from "@tanstack/react-start";
import { clientKey, consume } from "../../auth/rate-limit";
import {
	clearSessionCookie,
	readSessionToken,
	setSessionCookie,
} from "../../auth/session";
import { AppError } from "../../errors";
import { authMiddleware } from "../../middleware";
import {
	changePasswordSchema,
	forgotPasswordSchema,
	loginSchema,
	resetPasswordSchema,
	signupSchema,
} from "./schema";
import * as service from "./service";

const enforceRateLimit = () => {
	if (!consume(clientKey())) {
		throw new AppError("forbidden", "too many attempts, try again later");
	}
};

export const signup = createServerFn({ method: "POST" })
	.validator(signupSchema)
	.handler(async ({ data }) => {
		enforceRateLimit();
		const { response, token } = await service.signup(data);
		setSessionCookie(token);
		return response;
	});

export const login = createServerFn({ method: "POST" })
	.validator(loginSchema)
	.handler(async ({ data }) => {
		enforceRateLimit();
		const { response, token } = await service.login(data);
		setSessionCookie(token);
		return response;
	});

export const logout = createServerFn({ method: "POST" }).handler(async () => {
	const token = readSessionToken();
	if (token) await service.logout(token);
	clearSessionCookie();
	return { ok: true };
});

export const forgotPassword = createServerFn({ method: "POST" })
	.validator(forgotPasswordSchema)
	.handler(async ({ data }) => {
		enforceRateLimit();
		await service.forgotPassword(data);
		return { ok: true };
	});

export const resetPassword = createServerFn({ method: "POST" })
	.validator(resetPasswordSchema)
	.handler(async ({ data }) => {
		await service.resetPassword(data);
		clearSessionCookie();
		return { ok: true };
	});

export const changePassword = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(changePasswordSchema)
	.handler(async ({ data, context }) => {
		await service.changePassword(context.userId, data);
		clearSessionCookie();
		return { ok: true };
	});
