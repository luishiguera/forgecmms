import { toISO } from "../../db/client";
import { isForeignKeyViolation } from "../../db/pgerr";
import { conflict } from "../../errors";
import type { TenantContext } from "../../tenant";
import type { AttachmentRow } from "./repository";
import * as repository from "./repository";
import type {
	AttachmentCreateInput,
	AttachmentEntityType,
	AttachmentResponse,
} from "./schema";

const toResponse = (row: AttachmentRow): AttachmentResponse => ({
	id: row.id,
	entity_type: row.entityType as AttachmentEntityType,
	entity_id: row.entityId,
	file_url: row.fileUrl,
	file_name: row.fileName,
	file_size: row.fileSize,
	mime_type: row.mimeType,
	created_at: toISO(row.createdAt),
});

export const list = async (
	tc: TenantContext,
	entityType: AttachmentEntityType,
	entityId: number,
): Promise<AttachmentResponse[]> => {
	const rows = await repository.list(tc.organizationId, entityType, entityId);
	return rows.map(toResponse);
};

export const create = async (
	tc: TenantContext,
	input: AttachmentCreateInput,
): Promise<AttachmentResponse> => {
	const row = await repository
		.create({
			organizationId: tc.organizationId,
			entityType: input.entity_type,
			entityId: input.entity_id,
			fileUrl: input.file_url,
			fileName: input.file_name,
			fileSize: input.file_size ?? null,
			mimeType: input.mime_type,
		})
		.catch((error: unknown) => {
			if (isForeignKeyViolation(error)) throw conflict("unknown organization");
			throw error;
		});

	return toResponse(row);
};

export const remove = async (tc: TenantContext, attachmentId: number) => {
	await repository.hardDelete(tc.organizationId, attachmentId);
};
