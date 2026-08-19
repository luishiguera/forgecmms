import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { orgMiddleware } from "../../middleware";
import { entityIdSchema } from "../_shared/schema";
import {
	scheduleBlockCreateSchema,
	scheduleBlockUpdateSchema,
	scheduleSearchParamsSchema,
} from "./schema";
import * as service from "./service";

export const searchScheduleBlocks = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.validator(scheduleSearchParamsSchema)
	.handler(({ data, context }) => service.search(context.tenant, data));

export const createScheduleBlock = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(scheduleBlockCreateSchema)
	.handler(({ data, context }) => service.create(context.tenant, data));

export const updateScheduleBlock = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(
		z.object({ block_id: entityIdSchema, data: scheduleBlockUpdateSchema }),
	)
	.handler(({ data, context }) =>
		service.update(context.tenant, data.block_id, data.data),
	);

export const deleteScheduleBlock = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(z.object({ block_id: entityIdSchema }))
	.handler(async ({ data, context }) => {
		await service.remove(context.tenant, data.block_id);
		return { ok: true };
	});

export const deleteMyScheduleBlock = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(z.object({ block_id: entityIdSchema }))
	.handler(async ({ data, context }) => {
		await service.remove(context.tenant, data.block_id, context.tenant.userId);
		return { ok: true };
	});
