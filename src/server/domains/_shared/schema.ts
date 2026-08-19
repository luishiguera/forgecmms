import { z } from "zod";
import type { JsonValue } from "../../json";

export const TAG_ENTITY_TYPES = [
	"asset",
	"location",
	"part",
	"procedure",
	"work_order",
] as const;

export type TagEntityType = (typeof TAG_ENTITY_TYPES)[number];

export type { JsonValue };

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
	z.union([
		z.string(),
		z.number(),
		z.boolean(),
		z.null(),
		z.array(jsonValueSchema),
		z.record(z.string(), jsonValueSchema),
	]),
);

export const entityIdSchema = z.coerce.number().int().positive();

export const tagIdsSchema = z.array(entityIdSchema);

export const optionalUrlSchema = z.union([z.literal(""), z.url().max(2000)]);

const OFFSET_SUFFIX = /(?:Z|[+-]\d{2}:?\d{2})$/;

export const timestampSchema = z
	.string()
	.min(1)
	.transform((value) => (OFFSET_SUFFIX.test(value) ? value : `${value}Z`))
	.refine((value) => !Number.isNaN(Date.parse(value)))
	.transform((value) => new Date(value));

export const paginationSchema = z.object({
	page: entityIdSchema.catch(1).default(1),
	size: z.coerce.number().int().min(1).max(100).catch(20).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

export type Paginated<T> = {
	items: T[];
	page: number;
	size: number;
	total: number;
};

export const paginate = <T>(
	items: T[],
	{ page, size }: Pagination,
	total: number,
): Paginated<T> => ({ items, page, size, total });

export type TagResponse = {
	id: number;
	name: string;
	created_at: string;
};
