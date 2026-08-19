import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { orgMiddleware } from "../../middleware";
import {
	assetCreateSchema,
	assetSearchParamsSchema,
	assetUpdateSchema,
} from "./schema";
import * as service from "./service";

const assetId = z.number().int().positive();

export const searchAssets = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.validator(assetSearchParamsSchema)
	.handler(({ data, context }) => service.search(context.tenant, data));

export const getAsset = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.validator(z.object({ asset_id: assetId }))
	.handler(({ data, context }) => service.get(context.tenant, data.asset_id));

export const createAsset = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(assetCreateSchema)
	.handler(({ data, context }) => service.create(context.tenant, data));

export const updateAsset = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(z.object({ asset_id: assetId, data: assetUpdateSchema }))
	.handler(({ data, context }) =>
		service.update(context.tenant, data.asset_id, data.data),
	);

export const deleteAsset = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(z.object({ asset_id: assetId }))
	.handler(({ data, context }) =>
		service.remove(context.tenant, data.asset_id),
	);

export const setAssetTags = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(
		z.object({
			asset_id: assetId,
			tag_ids: z.array(z.number().int().positive()),
		}),
	)
	.handler(({ data, context }) =>
		service.setTags(context.tenant, data.asset_id, data.tag_ids),
	);
