import { db, toISO } from "../../db/client";
import { isUniqueViolation } from "../../db/pgerr";
import { conflict, notFound } from "../../errors";
import type { TenantContext } from "../../tenant";
import { type Paginated, paginate } from "../_shared/schema";
import { setEntityTags, tagsForEntities } from "../tags/repository";
import type { ProcedureRow } from "./repository";
import * as repository from "./repository";
import type {
	ProcedureCreateInput,
	ProcedureResponse,
	ProcedureSearchParams,
	ProcedureUpdateInput,
} from "./schema";

const toResponse = (
	row: ProcedureRow,
	tags: ProcedureResponse["tags"],
): ProcedureResponse => ({
	id: row.id,
	name: row.name,
	description: row.description,
	status: row.status,
	fields: row.fields,
	uses_count: row.usesCount,
	tags,
	created_at: toISO(row.createdAt),
	updated_at: toISO(row.updatedAt),
});

export const get = async (
	tc: TenantContext,
	procedureId: number,
): Promise<ProcedureResponse> => {
	const row = await repository.get(tc.organizationId, procedureId);
	if (!row) throw notFound();

	const tags = await tagsForEntities(tc.organizationId, "procedure", [row.id]);
	return toResponse(row, tags.get(row.id) ?? []);
};

export const search = async (
	tc: TenantContext,
	params: ProcedureSearchParams,
): Promise<Paginated<ProcedureResponse>> => {
	const { rows, total } = await repository.search(tc.organizationId, params);
	const tags = await tagsForEntities(
		tc.organizationId,
		"procedure",
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
	input: ProcedureCreateInput,
): Promise<ProcedureResponse> => {
	const procedureId = await db
		.transaction(async (tx) => {
			const id = await repository.create(
				{
					organizationId: tc.organizationId,
					name: input.name,
					description: input.description,
					status: input.status,
					fields: input.fields,
				},
				tx,
			);

			if (input.tag_ids?.length) {
				await setEntityTags(
					tc.organizationId,
					"procedure",
					id,
					input.tag_ids,
					tx,
				);
			}

			return id;
		})
		.catch((error: unknown) => {
			if (isUniqueViolation(error)) throw conflict("duplicate procedure");
			throw error;
		});

	return get(tc, procedureId);
};

export const update = async (
	tc: TenantContext,
	procedureId: number,
	input: ProcedureUpdateInput,
): Promise<ProcedureResponse> => {
	const patch: repository.ProcedurePatch = {};

	if (input.name !== undefined) patch.name = input.name;
	if (input.description !== undefined) patch.description = input.description;
	if (input.status !== undefined) patch.status = input.status;
	if (input.fields !== undefined) patch.fields = input.fields;

	try {
		await repository.update(tc.organizationId, procedureId, patch);
	} catch (error) {
		if (isUniqueViolation(error)) throw conflict("duplicate procedure");
		throw error;
	}

	return get(tc, procedureId);
};

export const remove = async (tc: TenantContext, procedureId: number) => {
	await repository.softDelete(tc.organizationId, procedureId);
};

export const setTags = async (
	tc: TenantContext,
	procedureId: number,
	tagIds: number[],
) => {
	await setEntityTags(tc.organizationId, "procedure", procedureId, tagIds);
};
