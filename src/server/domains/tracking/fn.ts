import { createServerFn } from "@tanstack/react-start";
import { orgMiddleware } from "../../middleware";
import { trackSearchParamsSchema, trackUpdateSchema } from "./schema";
import * as service from "./service";

export const updateMyLocation = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(trackUpdateSchema)
	.handler(async ({ data, context }) => {
		await service.updateLocation(context.tenant, data);
		return { ok: true };
	});

export const searchTracks = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.validator(trackSearchParamsSchema)
	.handler(({ data, context }) => service.search(context.tenant, data));
