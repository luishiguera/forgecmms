import { createMiddleware } from "@tanstack/react-start";
import { z } from "zod";
import { readSessionToken, resolveSession } from "./auth/session";
import { isAppError, unauthorized } from "./errors";
import { logError } from "./logger";
import { resolveTenant } from "./tenant";

export const authMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		const token = readSessionToken();
		if (!token) throw unauthorized();

		const session = await resolveSession(token);
		if (!session) throw unauthorized();

		try {
			return await next({
				context: { userId: session.userId, sessionToken: token },
			});
		} catch (error) {
			if (!isAppError(error)) {
				logError(`server function failed for user ${session.userId}`, error);
			}
			throw error;
		}
	},
);

export const organizationInput = z.looseObject({
	organization_id: z.coerce.number().int().positive(),
});

export const orgMiddleware = createMiddleware({ type: "function" })
	.middleware([authMiddleware])
	.validator(organizationInput)
	.server(async ({ next, data, context }) => {
		const tenant = await resolveTenant(context.userId, data.organization_id);
		return next({ context: { tenant } });
	});
