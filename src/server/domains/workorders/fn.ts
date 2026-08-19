import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { orgMiddleware } from "../../middleware";
import { entityIdSchema, tagIdsSchema } from "../_shared/schema";
import {
	procedureResponsesSchema,
	workOrderCreateSchema,
	workOrderPartCreateSchema,
	workOrderPartUpdateSchema,
	workOrderSearchParamsSchema,
	workOrderUpdateSchema,
} from "./schema";
import * as service from "./service";

const workOrderRef = z.object({ work_order_id: entityIdSchema });
const assetRef = workOrderRef.extend({ asset_id: entityIdSchema });
const partRef = workOrderRef.extend({ part_id: entityIdSchema });
const assigneeRef = workOrderRef.extend({ user_id: entityIdSchema });
const procedureRef = workOrderRef.extend({ procedure_id: entityIdSchema });
const assetProcedureRef = assetRef.extend({ procedure_id: entityIdSchema });

export const searchWorkOrders = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.validator(workOrderSearchParamsSchema)
	.handler(({ data, context }) => service.search(context.tenant, data));

export const getWorkOrder = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.validator(workOrderRef)
	.handler(({ data, context }) =>
		service.get(context.tenant, data.work_order_id),
	);

export const createWorkOrder = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(workOrderCreateSchema)
	.handler(({ data, context }) => service.create(context.tenant, data));

export const updateWorkOrder = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(workOrderRef.extend({ data: workOrderUpdateSchema }))
	.handler(({ data, context }) =>
		service.update(context.tenant, data.work_order_id, data.data),
	);

export const deleteWorkOrder = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(workOrderRef)
	.handler(async ({ data, context }) => {
		await service.remove(context.tenant, data.work_order_id);
		return { ok: true };
	});

export const setWorkOrderTags = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(workOrderRef.extend({ tag_ids: tagIdsSchema }))
	.handler(async ({ data, context }) => {
		await service.setTags(context.tenant, data.work_order_id, data.tag_ids);
		return { ok: true };
	});

export const addWorkOrderAsset = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(assetRef)
	.handler(({ data, context }) =>
		service.addAsset(context.tenant, data.work_order_id, data.asset_id),
	);

export const removeWorkOrderAsset = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(assetRef)
	.handler(({ data, context }) =>
		service.removeAsset(context.tenant, data.work_order_id, data.asset_id),
	);

export const addWorkOrderAssetProcedure = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(assetProcedureRef)
	.handler(({ data, context }) =>
		service.addAssetProcedure(
			context.tenant,
			data.work_order_id,
			data.asset_id,
			data.procedure_id,
		),
	);

export const updateWorkOrderAssetProcedure = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(
		assetProcedureRef.extend({ procedure_responses: procedureResponsesSchema }),
	)
	.handler(({ data, context }) =>
		service.updateAssetProcedure(
			context.tenant,
			data.work_order_id,
			data.asset_id,
			data.procedure_id,
			data.procedure_responses,
		),
	);

export const removeWorkOrderAssetProcedure = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(assetProcedureRef)
	.handler(({ data, context }) =>
		service.removeAssetProcedure(
			context.tenant,
			data.work_order_id,
			data.asset_id,
			data.procedure_id,
		),
	);

export const addWorkOrderPart = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(partRef.extend(workOrderPartCreateSchema.shape))
	.handler(({ data, context }) =>
		service.addPart(
			context.tenant,
			data.work_order_id,
			data.part_id,
			data.planned_quantity,
		),
	);

export const updateWorkOrderPart = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(partRef.extend(workOrderPartUpdateSchema.shape))
	.handler(({ data, context }) =>
		service.updatePart(
			context.tenant,
			data.work_order_id,
			data.part_id,
			data.planned_quantity,
			data.used_quantity,
		),
	);

export const removeWorkOrderPart = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(partRef)
	.handler(({ data, context }) =>
		service.removePart(context.tenant, data.work_order_id, data.part_id),
	);

export const addWorkOrderAssignee = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(assigneeRef)
	.handler(({ data, context }) =>
		service.addAssignee(context.tenant, data.work_order_id, data.user_id),
	);

export const removeWorkOrderAssignee = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(assigneeRef)
	.handler(({ data, context }) =>
		service.removeAssignee(context.tenant, data.work_order_id, data.user_id),
	);

export const addWorkOrderProcedure = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(procedureRef)
	.handler(({ data, context }) =>
		service.addProcedure(context.tenant, data.work_order_id, data.procedure_id),
	);

export const updateWorkOrderProcedure = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(
		procedureRef.extend({ procedure_responses: procedureResponsesSchema }),
	)
	.handler(({ data, context }) =>
		service.updateProcedure(
			context.tenant,
			data.work_order_id,
			data.procedure_id,
			data.procedure_responses,
		),
	);

export const removeWorkOrderProcedure = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(procedureRef)
	.handler(({ data, context }) =>
		service.removeProcedure(
			context.tenant,
			data.work_order_id,
			data.procedure_id,
		),
	);
