import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { orgMiddleware } from "../../middleware";
import { entityIdSchema } from "../_shared/schema";
import {
	tagCreateSchema,
	tagListParamsSchema,
	tagUpdateSchema,
} from "./schema";
import * as service from "./service";

export const listTags = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.validator(tagListParamsSchema)
	.handler(({ data, context }) => service.list(context.tenant, data.tag_type));

export const createTag = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(tagCreateSchema)
	.handler(({ data, context }) => service.create(context.tenant, data));

export const updateTag = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(z.object({ tag_id: entityIdSchema, data: tagUpdateSchema }))
	.handler(({ data, context }) =>
		service.update(context.tenant, data.tag_id, data.data),
	);

export const deleteTag = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(z.object({ tag_id: entityIdSchema }))
	.handler(({ data, context }) => service.remove(context.tenant, data.tag_id));
