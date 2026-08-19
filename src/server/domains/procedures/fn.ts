import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { orgMiddleware } from "../../middleware";
import { entityIdSchema, tagIdsSchema } from "../_shared/schema";
import {
	procedureCreateSchema,
	procedureSearchParamsSchema,
	procedureUpdateSchema,
} from "./schema";
import * as service from "./service";

export const searchProcedures = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.validator(procedureSearchParamsSchema)
	.handler(({ data, context }) => service.search(context.tenant, data));

export const getProcedure = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.validator(z.object({ procedure_id: entityIdSchema }))
	.handler(({ data, context }) =>
		service.get(context.tenant, data.procedure_id),
	);

export const createProcedure = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(procedureCreateSchema)
	.handler(({ data, context }) => service.create(context.tenant, data));

export const updateProcedure = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(
		z.object({ procedure_id: entityIdSchema, data: procedureUpdateSchema }),
	)
	.handler(({ data, context }) =>
		service.update(context.tenant, data.procedure_id, data.data),
	);

export const deleteProcedure = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(z.object({ procedure_id: entityIdSchema }))
	.handler(({ data, context }) =>
		service.remove(context.tenant, data.procedure_id),
	);

export const setProcedureTags = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(z.object({ procedure_id: entityIdSchema, tag_ids: tagIdsSchema }))
	.handler(({ data, context }) =>
		service.setTags(context.tenant, data.procedure_id, data.tag_ids),
	);
