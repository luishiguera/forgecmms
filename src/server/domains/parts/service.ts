import { db, toISO } from "../../db/client";
import { isUniqueViolation } from "../../db/pgerr";
import { conflict, notFound } from "../../errors";
import type { TenantContext } from "../../tenant";
import { type Paginated, paginate } from "../_shared/schema";
import { setEntityTags, tagsForEntities } from "../tags/repository";
import type { PartRow } from "./repository";
import * as repository from "./repository";
import type {
	PartCreateInput,
	PartResponse,
	PartSearchParams,
	PartUpdateInput,
} from "./schema";

const toResponse = (
	row: PartRow,
	tags: PartResponse["tags"],
): PartResponse => ({
	id: row.id,
	sku: row.sku,
	name: row.name,
	description: row.description,
	quantity: row.quantity,
	min_quantity: row.minQuantity,
	unit_price: row.unitPrice,
	currency: row.currency,
	unit_of_measure: row.unitOfMeasure,
	image_url: row.imageUrl,
	tags,
	created_at: toISO(row.createdAt),
});

export const get = async (
	tc: TenantContext,
	partId: number,
): Promise<PartResponse> => {
	const row = await repository.get(tc.organizationId, partId);
	if (!row) throw notFound();

	const tags = await tagsForEntities(tc.organizationId, "part", [row.id]);
	return toResponse(row, tags.get(row.id) ?? []);
};

export const search = async (
	tc: TenantContext,
	params: PartSearchParams,
): Promise<Paginated<PartResponse>> => {
	const { rows, total } = await repository.search(tc.organizationId, params);
	const tags = await tagsForEntities(
		tc.organizationId,
		"part",
		rows.map((row) => row.id),
	);

	return paginate(
		rows.map((row) => toResponse(row, tags.get(row.id) ?? [])),
		params,
		total,
	);
};

export const create = async (
	tc: TenantContext,
	input: PartCreateInput,
): Promise<PartResponse> => {
	const partId = await db
		.transaction(async (tx) => {
			const id = await repository.create(
				{
					organizationId: tc.organizationId,
					sku: input.sku,
					name: input.name,
					description: input.description,
					quantity: input.quantity,
					minQuantity: input.min_quantity,
					unitPrice: input.unit_price,
					currency: input.currency,
					unitOfMeasure: input.unit_of_measure,
					imageUrl: input.image_url,
				},
				tx,
			);

			if (input.tag_ids?.length) {
				await setEntityTags(tc.organizationId, "part", id, input.tag_ids, tx);
			}

			return id;
		})
		.catch((error: unknown) => {
			if (isUniqueViolation(error)) throw conflict("duplicate part");
			throw error;
		});

	return get(tc, partId);
};

export const update = async (
	tc: TenantContext,
	partId: number,
	input: PartUpdateInput,
): Promise<PartResponse> => {
	const patch: repository.PartPatch = {};

	if (input.sku !== undefined) patch.sku = input.sku;
	if (input.name !== undefined) patch.name = input.name;
	if (input.description !== undefined) patch.description = input.description;
	if (input.quantity !== undefined) patch.quantity = input.quantity;
	if (input.min_quantity !== undefined) patch.minQuantity = input.min_quantity;
	if (input.unit_price !== undefined) patch.unitPrice = input.unit_price;
	if (input.currency !== undefined) patch.currency = input.currency;
	if (input.unit_of_measure !== undefined)
		patch.unitOfMeasure = input.unit_of_measure;
	if (input.image_url !== undefined) patch.imageUrl = input.image_url;

	try {
		await repository.update(tc.organizationId, partId, patch);
	} catch (error) {
		if (isUniqueViolation(error)) throw conflict("duplicate part");
		throw error;
	}

	return get(tc, partId);
};

export const remove = async (tc: TenantContext, partId: number) => {
	await repository.softDelete(tc.organizationId, partId);
};

export const setTags = async (
	tc: TenantContext,
	partId: number,
	tagIds: number[],
) => {
	await setEntityTags(tc.organizationId, "part", partId, tagIds);
};
