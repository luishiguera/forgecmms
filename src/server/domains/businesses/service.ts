import { toISO } from "../../db/client";
import { isUniqueViolation } from "../../db/pgerr";
import { conflict, notFound } from "../../errors";
import type { TenantContext } from "../../tenant";
import { type Paginated, paginate } from "../_shared/schema";
import type { BusinessRow } from "./repository";
import * as repository from "./repository";
import type {
	BusinessCreateInput,
	BusinessLocationItemResponse,
	BusinessResponse,
	BusinessSearchParams,
	BusinessUpdateInput,
} from "./schema";

const toResponse = (
	row: BusinessRow,
	locations: BusinessLocationItemResponse[],
): BusinessResponse => ({
	id: row.id,
	name: row.name,
	tax_id: row.taxId,
	type: row.type,
	description: row.description,
	image_url: row.imageUrl,
	phones: row.phones,
	emails: row.emails,
	created_at: toISO(row.createdAt),
	locations,
});

export const get = async (
	tc: TenantContext,
	businessId: number,
): Promise<BusinessResponse> => {
	const row = await repository.get(tc.organizationId, businessId);
	if (!row) throw notFound();

	const locations = await repository.locationsForBusinesses(tc.organizationId, [
		row.id,
	]);
	return toResponse(row, locations.get(row.id) ?? []);
};

export const search = async (
	tc: TenantContext,
	params: BusinessSearchParams,
): Promise<Paginated<BusinessResponse>> => {
	const { rows, total } = await repository.search(tc.organizationId, params);

	return paginate(
		rows.map((row) => toResponse(row, [])),
		params,
		total,
	);
};

export const create = async (
	tc: TenantContext,
	input: BusinessCreateInput,
): Promise<BusinessResponse> => {
	const businessId = await repository
		.create({
			organizationId: tc.organizationId,
			name: input.name,
			taxId: input.tax_id,
			type: input.type,
			description: input.description,
			imageUrl: input.image_url,
			phones: input.phones,
			emails: input.emails,
		})
		.catch((error: unknown) => {
			if (isUniqueViolation(error)) throw conflict("duplicate business");
			throw error;
		});

	return get(tc, businessId);
};

export const update = async (
	tc: TenantContext,
	businessId: number,
	input: BusinessUpdateInput,
): Promise<BusinessResponse> => {
	const patch: repository.BusinessPatch = {};

	if (input.name !== undefined) patch.name = input.name;
	if (input.tax_id !== undefined) patch.taxId = input.tax_id;
	if (input.type !== undefined) patch.type = input.type;
	if (input.description !== undefined) patch.description = input.description;
	if (input.image_url !== undefined) patch.imageUrl = input.image_url;
	if (input.phones !== undefined) patch.phones = input.phones;
	if (input.emails !== undefined) patch.emails = input.emails;

	try {
		await repository.update(tc.organizationId, businessId, patch);
	} catch (error) {
		if (isUniqueViolation(error)) throw conflict("duplicate business");
		throw error;
	}

	return get(tc, businessId);
};

export const remove = async (tc: TenantContext, businessId: number) => {
	await repository.softDelete(tc.organizationId, businessId);
};
