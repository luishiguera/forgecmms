import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { orgMiddleware } from "../../middleware";
import { entityIdSchema, tagIdsSchema } from "../_shared/schema";
import {
	locationCreateSchema,
	locationSearchParamsSchema,
	locationUpdateSchema,
} from "./schema";
import * as service from "./service";

export const searchLocations = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.validator(locationSearchParamsSchema)
	.handler(({ data, context }) => service.search(context.tenant, data));

export const getLocation = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.validator(z.object({ location_id: entityIdSchema }))
	.handler(({ data, context }) =>
		service.get(context.tenant, data.location_id),
	);

export const createLocation = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(locationCreateSchema)
	.handler(({ data, context }) => service.create(context.tenant, data));

export const updateLocation = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(
		z.object({ location_id: entityIdSchema, data: locationUpdateSchema }),
	)
	.handler(({ data, context }) =>
		service.update(context.tenant, data.location_id, data.data),
	);

export const deleteLocation = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(z.object({ location_id: entityIdSchema }))
	.handler(({ data, context }) =>
		service.remove(context.tenant, data.location_id),
	);

export const setLocationTags = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(z.object({ location_id: entityIdSchema, tag_ids: tagIdsSchema }))
	.handler(({ data, context }) =>
		service.setTags(context.tenant, data.location_id, data.tag_ids),
	);
