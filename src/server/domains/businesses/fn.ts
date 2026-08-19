import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { orgMiddleware } from "../../middleware";
import { entityIdSchema } from "../_shared/schema";
import {
	businessCreateSchema,
	businessSearchParamsSchema,
	businessUpdateSchema,
} from "./schema";
import * as service from "./service";

export const searchBusinesses = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.validator(businessSearchParamsSchema)
	.handler(({ data, context }) => service.search(context.tenant, data));

export const getBusiness = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.validator(z.object({ business_id: entityIdSchema }))
	.handler(({ data, context }) =>
		service.get(context.tenant, data.business_id),
	);

export const createBusiness = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(businessCreateSchema)
	.handler(({ data, context }) => service.create(context.tenant, data));

export const updateBusiness = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(
		z.object({ business_id: entityIdSchema, data: businessUpdateSchema }),
	)
	.handler(({ data, context }) =>
		service.update(context.tenant, data.business_id, data.data),
	);

export const deleteBusiness = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(z.object({ business_id: entityIdSchema }))
	.handler(({ data, context }) =>
		service.remove(context.tenant, data.business_id),
	);
