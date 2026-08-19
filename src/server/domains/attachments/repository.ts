import { and, desc, eq } from "drizzle-orm";
import { db, type IDB } from "../../db/client";
import { attachments } from "../../db/schema";
import { notFound } from "../../errors";
import type { AttachmentEntityType } from "./schema";

const columns = {
	id: attachments.id,
	entityType: attachments.entityType,
	entityId: attachments.entityId,
	fileUrl: attachments.fileUrl,
	fileName: attachments.fileName,
	fileSize: attachments.fileSize,
	mimeType: attachments.mimeType,
	createdAt: attachments.createdAt,
};

export type AttachmentInsert = typeof attachments.$inferInsert;

export const create = async (values: AttachmentInsert, dbc: IDB = db) => {
	const [row] = await dbc.insert(attachments).values(values).returning(columns);
	return row;
};

export const list = async (
	organizationId: number,
	entityType: AttachmentEntityType,
	entityId: number,
	dbc: IDB = db,
) =>
	dbc
		.select(columns)
		.from(attachments)
		.where(
			and(
				eq(attachments.organizationId, organizationId),
				eq(attachments.entityType, entityType),
				eq(attachments.entityId, entityId),
			),
		)
		.orderBy(desc(attachments.createdAt));

export const hardDelete = async (
	organizationId: number,
	id: number,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.delete(attachments)
		.where(
			and(
				eq(attachments.id, id),
				eq(attachments.organizationId, organizationId),
			),
		)
		.returning({ id: attachments.id });

	if (rows.length === 0) throw notFound();
};

export type AttachmentRow = Awaited<ReturnType<typeof create>>;
