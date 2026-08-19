import { z } from "zod";
import {
	entityIdSchema,
	optionalUrlSchema,
	paginationSchema,
	type TagResponse,
	tagIdsSchema,
} from "../_shared/schema";

export const stockFilterSchema = z.enum(["low", "ok"]);

const quantity = z.number().int().max(2147483647);
const nonNegativeQuantity = quantity.min(0);

export const partSearchParamsSchema = paginationSchema.extend({
	q: z.string().optional(),
	tag_id: entityIdSchema.optional(),
	stock: stockFilterSchema.optional(),
});

export const partCreateSchema = z.object({
	sku: z.string().max(50).default(""),
	name: z.string().min(1).max(255),
	description: z.string().max(5000).default(""),
	quantity: quantity.default(0),
	min_quantity: nonNegativeQuantity.default(0),
	unit_price: nonNegativeQuantity.default(0),
	currency: z.string().max(3).default(""),
	unit_of_measure: z.string().max(50).default(""),
	image_url: optionalUrlSchema.default(""),
	tag_ids: tagIdsSchema.optional(),
});

export const partUpdateSchema = z.object({
	sku: z.string().min(1).max(50).optional(),
	name: z.string().min(1).max(255).optional(),
	description: z.string().max(5000).optional(),
	quantity: quantity.optional(),
	min_quantity: nonNegativeQuantity.optional(),
	unit_price: nonNegativeQuantity.optional(),
	currency: z.string().length(3).optional(),
	unit_of_measure: z.string().max(50).optional(),
	image_url: optionalUrlSchema.optional(),
});

export type StockFilter = z.infer<typeof stockFilterSchema>;
export type PartSearchParams = z.infer<typeof partSearchParamsSchema>;
export type PartCreateInput = z.infer<typeof partCreateSchema>;
export type PartUpdateInput = z.infer<typeof partUpdateSchema>;

export type PartSearchPayload = z.input<typeof partSearchParamsSchema>;
export type PartCreatePayload = z.input<typeof partCreateSchema>;
export type PartUpdatePayload = z.input<typeof partUpdateSchema>;

export type PartResponse = {
	id: number;
	sku: string;
	name: string;
	description: string;
	quantity: number;
	min_quantity: number;
	unit_price: number;
	currency: string;
	unit_of_measure: string;
	image_url: string;
	tags: TagResponse[];
	created_at: string;
};
