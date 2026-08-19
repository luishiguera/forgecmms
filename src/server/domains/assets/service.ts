import { db, toISO } from "../../db/client";
import { isUniqueViolation } from "../../db/pgerr";
import { conflict, notFound } from "../../errors";
import type { TenantContext } from "../../tenant";
import { type Paginated, paginate } from "../_shared/schema";
import { setEntityTags, tagsForEntities } from "../tags/repository";
import type { AssetRow } from "./repository";
import * as repository from "./repository";
import type {
	AssetCreateInput,
	AssetResponse,
	AssetSearchParams,
	AssetUpdateInput,
} from "./schema";

const toResponse = (
	row: AssetRow,
	tags: AssetResponse["tags"],
): AssetResponse => ({
	id: row.id,
	parent_asset_id: row.parentAssetId,
	location_id: row.locationId,
	serial_number: row.serialNumber,
	model: row.model,
	manufacturer: row.manufacturer,
	name: row.name,
	description: row.description,
	status: row.status,
	criticality: row.criticality,
	assignment_status: row.assignmentStatus,
	image_url: row.imageUrl,
	tags,
	location: row.location?.id
		? {
				id: row.location.id,
				name: row.location.name,
				address: row.location.address,
				image_url: row.location.imageUrl,
			}
		: null,
	created_at: toISO(row.createdAt),
});

export const get = async (
	tc: TenantContext,
	assetId: number,
): Promise<AssetResponse> => {
	const row = await repository.get(tc.organizationId, assetId);
	if (!row) throw notFound();

	const tags = await tagsForEntities(tc.organizationId, "asset", [row.id]);
	return toResponse(row, tags.get(row.id) ?? []);
};

export const search = async (
	tc: TenantContext,
	params: AssetSearchParams,
): Promise<Paginated<AssetResponse>> => {
	const { rows, total } = await repository.search(tc.organizationId, params);
	const tags = await tagsForEntities(
		tc.organizationId,
		"asset",
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
	input: AssetCreateInput,
): Promise<AssetResponse> => {
	const assetId = await db
		.transaction(async (tx) => {
			const id = await repository.create(
				{
					organizationId: tc.organizationId,
					parentAssetId: input.parent_asset_id ?? null,
					locationId: input.location_id ?? null,
					serialNumber: input.serial_number,
					model: input.model,
					manufacturer: input.manufacturer,
					name: input.name,
					description: input.description,
					status: input.status,
					criticality: input.criticality,
					assignmentStatus: input.assignment_status ?? "available",
					imageUrl: input.image_url,
				},
				tx,
			);

			if (input.tag_ids?.length) {
				await setEntityTags(tc.organizationId, "asset", id, input.tag_ids, tx);
			}

			return id;
		})
		.catch((error: unknown) => {
			if (isUniqueViolation(error)) throw conflict("duplicate asset");
			throw error;
		});

	return get(tc, assetId);
};

export const update = async (
	tc: TenantContext,
	assetId: number,
	input: AssetUpdateInput,
): Promise<AssetResponse> => {
	const patch: repository.AssetPatch = {};

	if (input.serial_number !== undefined)
		patch.serialNumber = input.serial_number;
	if (input.model !== undefined) patch.model = input.model;
	if (input.manufacturer !== undefined) patch.manufacturer = input.manufacturer;
	if (input.name !== undefined) patch.name = input.name;
	if (input.description !== undefined) patch.description = input.description;
	if (input.status !== undefined) patch.status = input.status;
	if (input.criticality !== undefined) patch.criticality = input.criticality;
	if (input.assignment_status !== undefined)
		patch.assignmentStatus = input.assignment_status;
	if (input.image_url !== undefined) patch.imageUrl = input.image_url;
	if ("location_id" in input) patch.locationId = input.location_id ?? null;
	if ("parent_asset_id" in input)
		patch.parentAssetId = input.parent_asset_id ?? null;

	try {
		await repository.update(tc.organizationId, assetId, patch);
	} catch (error) {
		if (isUniqueViolation(error)) throw conflict("duplicate asset");
		throw error;
	}

	return get(tc, assetId);
};

export const remove = async (tc: TenantContext, assetId: number) => {
	await repository.softDelete(tc.organizationId, assetId);
};

export const setTags = async (
	tc: TenantContext,
	assetId: number,
	tagIds: number[],
) => {
	await setEntityTags(tc.organizationId, "asset", assetId, tagIds);
};
