import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { setSessionCookie } from "../../auth/session";
import { orgMiddleware } from "../../middleware";
import { entityIdSchema } from "../_shared/schema";
import {
	invitationAcceptSchema,
	invitationCreateSchema,
	invitationSearchParamsSchema,
	invitationTokenSchema,
} from "./schema";
import * as service from "./service";

export const createInvitation = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(invitationCreateSchema)
	.handler(async ({ data, context }) => {
		await service.create(context.tenant, data);
		return { ok: true };
	});

export const searchInvitations = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.validator(invitationSearchParamsSchema)
	.handler(({ data, context }) => service.search(context.tenant, data));

export const cancelInvitation = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(z.object({ invitation_id: entityIdSchema }))
	.handler(async ({ data, context }) => {
		await service.cancel(context.tenant, data.invitation_id);
		return { ok: true };
	});

export const getInvitationDetails = createServerFn({ method: "GET" })
	.validator(invitationTokenSchema)
	.handler(({ data }) => service.getByToken(data.token));

export const acceptInvitation = createServerFn({ method: "POST" })
	.validator(invitationAcceptSchema)
	.handler(async ({ data }) => {
		const token = await service.accept(data);
		setSessionCookie(token);
		return { ok: true };
	});
