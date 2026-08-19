import { toISO } from "../../db/client";
import { isUniqueViolation } from "../../db/pgerr";
import { conflict } from "../../errors";
import type { TenantContext } from "../../tenant";
import type { TagResponse } from "../_shared/schema";
import * as repository from "./repository";
import type { TagCreateInput, TagType, TagUpdateInput } from "./schema";

type TagRow = { id: number; name: string; createdAt: Date };

const toResponse = (row: TagRow): TagResponse => ({
	id: row.id,
	name: row.name,
	created_at: toISO(row.createdAt),
});

export const list = async (
	tc: TenantContext,
	tagType: TagType,
): Promise<TagResponse[]> => {
	const rows = await repository.list(tc.organizationId, tagType);
	return rows.map(toResponse);
};

export const create = async (
	tc: TenantContext,
	input: TagCreateInput,
): Promise<TagResponse> => {
	const row = await repository
		.create(tc.organizationId, input.tag_type, input.name)
		.catch((error: unknown) => {
			if (isUniqueViolation(error)) throw conflict("duplicate tag");
			throw error;
		});

	return toResponse(row);
};

export const update = async (
	tc: TenantContext,
	tagId: number,
	input: TagUpdateInput,
): Promise<TagResponse> => {
	const patch: repository.TagPatch = {};
	if (input.name !== undefined) patch.name = input.name;

	const row = await repository
		.update(tc.organizationId, tagId, patch)
		.catch((error: unknown) => {
			if (isUniqueViolation(error)) throw conflict("duplicate tag");
			throw error;
		});

	return toResponse(row);
};

export const remove = async (tc: TenantContext, tagId: number) => {
	await repository.hardDelete(tc.organizationId, tagId);
};
