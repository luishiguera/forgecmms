import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { orgMiddleware } from "../../middleware";
import { entityIdSchema } from "../_shared/schema";
import { attachmentCreateSchema, attachmentListParamsSchema } from "./schema";
import * as service from "./service";

export const listAttachments = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.validator(attachmentListParamsSchema)
	.handler(({ data, context }) =>
		service.list(context.tenant, data.entity_type, data.entity_id),
	);

export const createAttachment = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(attachmentCreateSchema)
	.handler(({ data, context }) => service.create(context.tenant, data));

export const deleteAttachment = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(z.object({ attachment_id: entityIdSchema }))
	.handler(({ data, context }) =>
		service.remove(context.tenant, data.attachment_id),
	);
