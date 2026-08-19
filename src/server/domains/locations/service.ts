import { db, toISO } from "../../db/client";
import { isForeignKeyViolation, isUniqueViolation } from "../../db/pgerr";
import { conflict, notFound } from "../../errors";
import type { TenantContext } from "../../tenant";
import { type Paginated, paginate } from "../_shared/schema";
import { setEntityTags, tagsForEntities } from "../tags/repository";
import type { LocationRow } from "./repository";
import * as repository from "./repository";
import type {
	LocationAssetItemResponse,
	LocationCreateInput,
	LocationResponse,
	LocationSearchParams,
	LocationUpdateInput,
} from "./schema";

const toResponse = (
	row: LocationRow,
	tags: LocationResponse["tags"],
	assets: LocationAssetItemResponse[],
): LocationResponse => ({
	id: row.id,
	parent_location_id: row.parentLocationId,
	business_id: row.businessId,
	name: row.name,
	address: row.address,
	city: row.city,
	state: row.state,
	postal_code: row.postalCode,
	country: row.country,
	description: row.description,
	image_url: row.imageUrl,
	latitude: row.latitude,
	longitude: row.longitude,
	phones: row.phones,
	emails: row.emails,
	created_at: toISO(row.createdAt),
	tags,
	assets,
	business: row.business?.id
		? {
				id: row.business.id,
				name: row.business.name,
				type: row.business.type,
				image_url: row.business.imageUrl,
				phones: row.business.phones,
				emails: row.business.emails,
			}
		: null,
});

export const get = async (
	tc: TenantContext,
	locationId: number,
): Promise<LocationResponse> => {
	const row = await repository.get(tc.organizationId, locationId);
	if (!row) throw notFound();

	const [tags, assets] = await Promise.all([
		tagsForEntities(tc.organizationId, "location", [row.id]),
		repository.assetsForLocations(tc.organizationId, [row.id]),
	]);

	return toResponse(row, tags.get(row.id) ?? [], assets.get(row.id) ?? []);
};

export const search = async (
	tc: TenantContext,
	params: LocationSearchParams,
): Promise<Paginated<LocationResponse>> => {
	const { rows, total } = await repository.search(tc.organizationId, params);
	const tags = await tagsForEntities(
		tc.organizationId,
		"location",
		rows.map((row) => row.id),
	);

	return paginate(
		rows.map((row) => toResponse(row, tags.get(row.id) ?? [], [])),
		params,
		total,
	);
};

export const create = async (
	tc: TenantContext,
	input: LocationCreateInput,
): Promise<LocationResponse> => {
	const locationId = await db
		.transaction(async (tx) => {
			const id = await repository.create(
				{
					organizationId: tc.organizationId,
					parentLocationId: input.parent_location_id ?? null,
					businessId: input.business_id ?? null,
					name: input.name,
					address: input.address,
					city: input.city,
					state: input.state,
					postalCode: input.postal_code,
					country: input.country,
					description: input.description,
					imageUrl: input.image_url,
					latitude: input.latitude ?? null,
					longitude: input.longitude ?? null,
					phones: input.phones,
					emails: input.emails,
				},
				tx,
			);

			if (input.tag_ids?.length) {
				await setEntityTags(
					tc.organizationId,
					"location",
					id,
					input.tag_ids,
					tx,
				);
			}

			return id;
		})
		.catch((error: unknown) => {
			if (isUniqueViolation(error)) throw conflict("duplicate location");
			if (isForeignKeyViolation(error)) throw conflict("unknown reference");
			throw error;
		});

	return get(tc, locationId);
};

export const update = async (
	tc: TenantContext,
	locationId: number,
	input: LocationUpdateInput,
): Promise<LocationResponse> => {
	const patch: repository.LocationPatch = {};

	if (input.parent_location_id !== undefined)
		patch.parentLocationId = input.parent_location_id;
	if ("business_id" in input) patch.businessId = input.business_id ?? null;
	if (input.name !== undefined) patch.name = input.name;
	if (input.address !== undefined) patch.address = input.address;
	if (input.city !== undefined) patch.city = input.city;
	if (input.state !== undefined) patch.state = input.state;
	if (input.postal_code !== undefined) patch.postalCode = input.postal_code;
	if (input.country !== undefined) patch.country = input.country;
	if (input.description !== undefined) patch.description = input.description;
	if (input.image_url !== undefined) patch.imageUrl = input.image_url;
	if (input.latitude !== undefined) patch.latitude = input.latitude;
	if (input.longitude !== undefined) patch.longitude = input.longitude;
	if (input.phones !== undefined) patch.phones = input.phones;
	if (input.emails !== undefined) patch.emails = input.emails;

	try {
		await repository.update(tc.organizationId, locationId, patch);
	} catch (error) {
		if (isUniqueViolation(error)) throw conflict("duplicate location");
		if (isForeignKeyViolation(error)) throw conflict("unknown reference");
		throw error;
	}

	return get(tc, locationId);
};

export const remove = async (tc: TenantContext, locationId: number) => {
	await repository.softDelete(tc.organizationId, locationId);
};

export const setTags = async (
	tc: TenantContext,
	locationId: number,
	tagIds: number[],
) => {
	await setEntityTags(tc.organizationId, "location", locationId, tagIds);
};
