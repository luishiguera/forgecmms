import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware, orgMiddleware } from "../../middleware";
import { entityIdSchema } from "../_shared/schema";
import {
	memberSearchParamsSchema,
	memberUpdateSchema,
	organizationCreateSchema,
	organizationUpdateSchema,
} from "./schema";
import * as service from "./service";

export const listMyOrganizations = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(({ context }) => service.listForUser(context.userId));

export const createOrganization = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(organizationCreateSchema)
	.handler(({ data, context }) => service.create(context.userId, data));

export const getOrganization = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.handler(({ context }) => service.get(context.tenant));

export const updateOrganization = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(organizationUpdateSchema)
	.handler(({ data, context }) => service.update(context.tenant, data));

export const searchMembers = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.validator(memberSearchParamsSchema)
	.handler(({ data, context }) => service.searchMembers(context.tenant, data));

export const getMember = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.validator(z.object({ member_id: entityIdSchema }))
	.handler(({ data, context }) =>
		service.getMember(context.tenant, data.member_id),
	);

export const updateMember = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(z.object({ member_id: entityIdSchema, data: memberUpdateSchema }))
	.handler(({ data, context }) =>
		service.updateMember(context.tenant, data.member_id, data.data),
	);

export const removeMember = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(z.object({ member_id: entityIdSchema }))
	.handler(({ data, context }) =>
		service.removeMember(context.tenant, data.member_id),
	);
