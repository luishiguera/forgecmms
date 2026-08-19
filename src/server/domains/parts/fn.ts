import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { orgMiddleware } from "../../middleware";
import { entityIdSchema, tagIdsSchema } from "../_shared/schema";
import {
	partCreateSchema,
	partSearchParamsSchema,
	partUpdateSchema,
} from "./schema";
import * as service from "./service";

export const searchParts = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.validator(partSearchParamsSchema)
	.handler(({ data, context }) => service.search(context.tenant, data));

export const getPart = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.validator(z.object({ part_id: entityIdSchema }))
	.handler(({ data, context }) => service.get(context.tenant, data.part_id));

export const createPart = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(partCreateSchema)
	.handler(({ data, context }) => service.create(context.tenant, data));

export const updatePart = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(z.object({ part_id: entityIdSchema, data: partUpdateSchema }))
	.handler(({ data, context }) =>
		service.update(context.tenant, data.part_id, data.data),
	);

export const deletePart = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(z.object({ part_id: entityIdSchema }))
	.handler(({ data, context }) => service.remove(context.tenant, data.part_id));

export const setPartTags = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(z.object({ part_id: entityIdSchema, tag_ids: tagIdsSchema }))
	.handler(({ data, context }) =>
		service.setTags(context.tenant, data.part_id, data.tag_ids),
	);
