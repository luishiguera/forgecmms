import {
	and,
	asc,
	eq,
	ilike,
	inArray,
	isNull,
	notInArray,
	or,
	sql,
} from "drizzle-orm";
import { db, type IDB } from "../../db/client";
import {
	assets,
	businesses,
	locations,
	parts,
	procedures,
	tagAssignments,
	users,
	workOrderAssetProcedures,
	workOrderAssets,
	workOrderAssignees,
	workOrderParts,
	workOrderProcedures,
	workOrders,
} from "../../db/schema";
import { notFound } from "../../errors";
import type { ProcedureResponses } from "./schema";

const columns = {
	id: workOrders.id,
	title: workOrders.title,
	description: workOrders.description,
	status: workOrders.status,
	type: workOrders.type,
	priority: workOrders.priority,
	plannedStart: workOrders.plannedStart,
	plannedEnd: workOrders.plannedEnd,
	startedAt: workOrders.startedAt,
	closedAt: workOrders.closedAt,
	cancellationReason: workOrders.cancellationReason,
	locationId: workOrders.locationId,
	recurrenceType: workOrders.recurrenceType,
	recurrenceConfig: workOrders.recurrenceConfig,
	parentWorkOrderId: workOrders.parentWorkOrderId,
	reportUrl: workOrders.reportUrl,
	reportGeneratedAt: workOrders.reportGeneratedAt,
	createdAt: workOrders.createdAt,
	updatedAt: workOrders.updatedAt,
	location: {
		id: locations.id,
		name: locations.name,
		address: locations.address,
		imageUrl: locations.imageUrl,
		latitude: locations.latitude,
		longitude: locations.longitude,
		phones: locations.phones,
	},
	business: {
		id: businesses.id,
		name: businesses.name,
		type: businesses.type,
		phones: businesses.phones,
		emails: businesses.emails,
	},
};

export type WorkOrderInsert = typeof workOrders.$inferInsert;

export type WorkOrderPatch = Partial<{
	title: string;
	description: string;
	status: typeof workOrders.$inferInsert.status;
	type: typeof workOrders.$inferInsert.type;
	priority: typeof workOrders.$inferInsert.priority;
	plannedStart: Date;
	plannedEnd: Date;
	startedAt: Date | null;
	closedAt: Date | null;
	cancellationReason: string;
	locationId: number | null;
	recurrenceType: typeof workOrders.$inferInsert.recurrenceType;
	recurrenceConfig: typeof workOrders.$inferInsert.recurrenceConfig;
	reportUrl: string;
	reportGeneratedAt: Date;
}>;

export const create = async (values: WorkOrderInsert, dbc: IDB = db) => {
	const [row] = await dbc
		.insert(workOrders)
		.values(values)
		.returning({ id: workOrders.id });
	return row.id;
};

export const get = async (
	organizationId: number,
	id: number,
	dbc: IDB = db,
) => {
	const [row] = await dbc
		.select(columns)
		.from(workOrders)
		.leftJoin(
			locations,
			and(eq(locations.id, workOrders.locationId), isNull(locations.deletedAt)),
		)
		.leftJoin(
			businesses,
			and(
				eq(businesses.id, locations.businessId),
				isNull(businesses.deletedAt),
			),
		)
		.where(
			and(
				eq(workOrders.id, id),
				eq(workOrders.organizationId, organizationId),
				isNull(workOrders.deletedAt),
			),
		)
		.limit(1);

	return row;
};

export const update = async (
	organizationId: number,
	id: number,
	patch: WorkOrderPatch,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(workOrders)
		.set({ ...patch, updatedAt: sql`NOW()` })
		.where(
			and(
				eq(workOrders.id, id),
				eq(workOrders.organizationId, organizationId),
				isNull(workOrders.deletedAt),
			),
		)
		.returning({ id: workOrders.id });

	if (rows.length === 0) throw notFound();
};

export const softDelete = async (
	organizationId: number,
	id: number,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(workOrders)
		.set({ deletedAt: sql`NOW()` })
		.where(
			and(
				eq(workOrders.id, id),
				eq(workOrders.organizationId, organizationId),
				isNull(workOrders.deletedAt),
			),
		)
		.returning({ id: workOrders.id });

	if (rows.length === 0) throw notFound();
};

export type WorkOrderSearchFilters = {
	q?: string;
	status?: typeof workOrders.$inferInsert.status;
	type?: typeof workOrders.$inferInsert.type;
	priority?: typeof workOrders.$inferInsert.priority;
	tag_id?: number;
	location_id?: number;
	asset_id?: number;
	part_id?: number;
	assignee_id?: number;
	assignment?: "assigned" | "unassigned";
	plannedStartFrom?: Date;
	plannedStartTo?: Date;
	page: number;
	size: number;
};

const searchFilters = (
	organizationId: number,
	filters: WorkOrderSearchFilters,
	dbc: IDB,
) => {
	const pattern = filters.q ? `%${filters.q}%` : undefined;

	const assigneeWorkOrderIds = dbc
		.select({ workOrderId: workOrderAssignees.workOrderId })
		.from(workOrderAssignees)
		.where(eq(workOrderAssignees.organizationId, organizationId));

	return and(
		eq(workOrders.organizationId, organizationId),
		isNull(workOrders.deletedAt),
		pattern
			? or(
					ilike(workOrders.title, pattern),
					ilike(workOrders.description, pattern),
				)
			: undefined,
		filters.status ? eq(workOrders.status, filters.status) : undefined,
		filters.type ? eq(workOrders.type, filters.type) : undefined,
		filters.priority ? eq(workOrders.priority, filters.priority) : undefined,
		filters.location_id
			? eq(workOrders.locationId, filters.location_id)
			: undefined,
		filters.tag_id
			? inArray(
					workOrders.id,
					dbc
						.select({ entityId: tagAssignments.entityId })
						.from(tagAssignments)
						.where(
							and(
								eq(tagAssignments.organizationId, organizationId),
								eq(tagAssignments.tagId, filters.tag_id),
								eq(tagAssignments.entityType, "work_order"),
							),
						),
				)
			: undefined,
		filters.asset_id
			? inArray(
					workOrders.id,
					dbc
						.select({ workOrderId: workOrderAssets.workOrderId })
						.from(workOrderAssets)
						.where(
							and(
								eq(workOrderAssets.organizationId, organizationId),
								eq(workOrderAssets.assetId, filters.asset_id),
							),
						),
				)
			: undefined,
		filters.part_id
			? inArray(
					workOrders.id,
					dbc
						.select({ workOrderId: workOrderParts.workOrderId })
						.from(workOrderParts)
						.where(
							and(
								eq(workOrderParts.organizationId, organizationId),
								eq(workOrderParts.partId, filters.part_id),
							),
						),
				)
			: undefined,
		filters.assignee_id
			? inArray(
					workOrders.id,
					dbc
						.select({ workOrderId: workOrderAssignees.workOrderId })
						.from(workOrderAssignees)
						.where(
							and(
								eq(workOrderAssignees.organizationId, organizationId),
								eq(workOrderAssignees.userId, filters.assignee_id),
							),
						),
				)
			: undefined,
		filters.assignment === "assigned"
			? inArray(workOrders.id, assigneeWorkOrderIds)
			: undefined,
		filters.assignment === "unassigned"
			? notInArray(workOrders.id, assigneeWorkOrderIds)
			: undefined,
		filters.plannedStartFrom
			? sql`${workOrders.plannedStart} >= ${filters.plannedStartFrom}`
			: undefined,
		filters.plannedStartTo
			? sql`${workOrders.plannedStart} < ${filters.plannedStartTo}`
			: undefined,
	);
};

export const search = async (
	organizationId: number,
	filters: WorkOrderSearchFilters,
	dbc: IDB = db,
) => {
	const where = searchFilters(organizationId, filters, dbc);

	const rows = await dbc
		.select(columns)
		.from(workOrders)
		.leftJoin(locations, eq(locations.id, workOrders.locationId))
		.leftJoin(
			businesses,
			and(
				eq(businesses.id, locations.businessId),
				isNull(businesses.deletedAt),
			),
		)
		.where(where)
		.orderBy(sql`${workOrders.plannedStart} ASC NULLS LAST`)
		.limit(filters.size)
		.offset((filters.page - 1) * filters.size);

	const total = await dbc.$count(workOrders, where);

	return { rows, total };
};

export const listAssets = async (
	organizationId: number,
	workOrderId: number,
	dbc: IDB = db,
) =>
	dbc
		.select({
			id: assets.id,
			name: assets.name,
			serialNumber: assets.serialNumber,
			imageUrl: assets.imageUrl,
			status: assets.status,
			criticality: assets.criticality,
			locationId: assets.locationId,
			assignmentStatus: assets.assignmentStatus,
		})
		.from(workOrderAssets)
		.innerJoin(
			assets,
			and(eq(assets.id, workOrderAssets.assetId), isNull(assets.deletedAt)),
		)
		.where(
			and(
				eq(workOrderAssets.organizationId, organizationId),
				eq(workOrderAssets.workOrderId, workOrderId),
			),
		)
		.orderBy(asc(workOrderAssets.assetId));

export const listAssetProcedures = async (
	organizationId: number,
	workOrderId: number,
	dbc: IDB = db,
) =>
	dbc
		.select({
			assetId: workOrderAssetProcedures.assetId,
			id: procedures.id,
			name: procedures.name,
			description: procedures.description,
			procedureResponses: workOrderAssetProcedures.procedureResponses,
		})
		.from(workOrderAssetProcedures)
		.innerJoin(
			procedures,
			and(
				eq(procedures.id, workOrderAssetProcedures.procedureId),
				isNull(procedures.deletedAt),
			),
		)
		.where(
			and(
				eq(workOrderAssetProcedures.organizationId, organizationId),
				eq(workOrderAssetProcedures.workOrderId, workOrderId),
			),
		)
		.orderBy(
			asc(workOrderAssetProcedures.assetId),
			asc(workOrderAssetProcedures.procedureId),
		);

export const listProcedures = async (
	organizationId: number,
	workOrderId: number,
	dbc: IDB = db,
) =>
	dbc
		.select({
			id: procedures.id,
			name: procedures.name,
			description: procedures.description,
			procedureResponses: workOrderProcedures.procedureResponses,
		})
		.from(workOrderProcedures)
		.innerJoin(
			procedures,
			and(
				eq(procedures.id, workOrderProcedures.procedureId),
				isNull(procedures.deletedAt),
			),
		)
		.where(
			and(
				eq(workOrderProcedures.organizationId, organizationId),
				eq(workOrderProcedures.workOrderId, workOrderId),
			),
		)
		.orderBy(asc(workOrderProcedures.procedureId));

export const listParts = async (
	organizationId: number,
	workOrderId: number,
	dbc: IDB = db,
) =>
	dbc
		.select({
			id: parts.id,
			name: parts.name,
			sku: parts.sku,
			imageUrl: parts.imageUrl,
			plannedQuantity: workOrderParts.plannedQuantity,
			usedQuantity: workOrderParts.usedQuantity,
		})
		.from(workOrderParts)
		.innerJoin(
			parts,
			and(eq(parts.id, workOrderParts.partId), isNull(parts.deletedAt)),
		)
		.where(
			and(
				eq(workOrderParts.organizationId, organizationId),
				eq(workOrderParts.workOrderId, workOrderId),
			),
		)
		.orderBy(asc(workOrderParts.partId));

export const listAssignees = async (
	organizationId: number,
	workOrderIds: number[],
	dbc: IDB = db,
) => {
	if (workOrderIds.length === 0) return [];

	return dbc
		.select({
			workOrderId: workOrderAssignees.workOrderId,
			id: users.id,
			fullName: users.fullName,
			photoUrl: users.photoUrl,
			email: users.email,
		})
		.from(workOrderAssignees)
		.innerJoin(users, eq(users.id, workOrderAssignees.userId))
		.where(
			and(
				eq(workOrderAssignees.organizationId, organizationId),
				inArray(workOrderAssignees.workOrderId, workOrderIds),
			),
		)
		.orderBy(asc(workOrderAssignees.workOrderId), asc(users.id));
};

export const createAsset = async (
	organizationId: number,
	workOrderId: number,
	assetId: number,
	dbc: IDB = db,
) => {
	await dbc
		.insert(workOrderAssets)
		.values({ organizationId, workOrderId, assetId });
};

export const deleteAsset = async (
	organizationId: number,
	workOrderId: number,
	assetId: number,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.delete(workOrderAssets)
		.where(
			and(
				eq(workOrderAssets.organizationId, organizationId),
				eq(workOrderAssets.workOrderId, workOrderId),
				eq(workOrderAssets.assetId, assetId),
			),
		)
		.returning({ assetId: workOrderAssets.assetId });

	if (rows.length === 0) throw notFound();
};

export const createAssignee = async (
	organizationId: number,
	workOrderId: number,
	userId: number,
	dbc: IDB = db,
) => {
	await dbc
		.insert(workOrderAssignees)
		.values({ organizationId, workOrderId, userId });
};

export const deleteAssignee = async (
	organizationId: number,
	workOrderId: number,
	userId: number,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.delete(workOrderAssignees)
		.where(
			and(
				eq(workOrderAssignees.organizationId, organizationId),
				eq(workOrderAssignees.workOrderId, workOrderId),
				eq(workOrderAssignees.userId, userId),
			),
		)
		.returning({ userId: workOrderAssignees.userId });

	if (rows.length === 0) throw notFound();
};

export const createProcedure = async (
	organizationId: number,
	workOrderId: number,
	procedureId: number,
	dbc: IDB = db,
) => {
	await dbc
		.insert(workOrderProcedures)
		.values({ organizationId, workOrderId, procedureId });
};

export const updateProcedureResponses = async (
	organizationId: number,
	workOrderId: number,
	procedureId: number,
	procedureResponses: ProcedureResponses,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(workOrderProcedures)
		.set({ procedureResponses })
		.where(
			and(
				eq(workOrderProcedures.organizationId, organizationId),
				eq(workOrderProcedures.workOrderId, workOrderId),
				eq(workOrderProcedures.procedureId, procedureId),
			),
		)
		.returning({ procedureId: workOrderProcedures.procedureId });

	if (rows.length === 0) throw notFound();
};

export const deleteProcedure = async (
	organizationId: number,
	workOrderId: number,
	procedureId: number,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.delete(workOrderProcedures)
		.where(
			and(
				eq(workOrderProcedures.organizationId, organizationId),
				eq(workOrderProcedures.workOrderId, workOrderId),
				eq(workOrderProcedures.procedureId, procedureId),
			),
		)
		.returning({ procedureId: workOrderProcedures.procedureId });

	if (rows.length === 0) throw notFound();
};

export const createAssetProcedure = async (
	organizationId: number,
	workOrderId: number,
	assetId: number,
	procedureId: number,
	dbc: IDB = db,
) => {
	await dbc
		.insert(workOrderAssetProcedures)
		.values({ organizationId, workOrderId, assetId, procedureId });
};

export const updateAssetProcedureResponses = async (
	organizationId: number,
	workOrderId: number,
	assetId: number,
	procedureId: number,
	procedureResponses: ProcedureResponses,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(workOrderAssetProcedures)
		.set({ procedureResponses })
		.where(
			and(
				eq(workOrderAssetProcedures.organizationId, organizationId),
				eq(workOrderAssetProcedures.workOrderId, workOrderId),
				eq(workOrderAssetProcedures.assetId, assetId),
				eq(workOrderAssetProcedures.procedureId, procedureId),
			),
		)
		.returning({ procedureId: workOrderAssetProcedures.procedureId });

	if (rows.length === 0) throw notFound();
};

export const deleteAssetProcedure = async (
	organizationId: number,
	workOrderId: number,
	assetId: number,
	procedureId: number,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.delete(workOrderAssetProcedures)
		.where(
			and(
				eq(workOrderAssetProcedures.organizationId, organizationId),
				eq(workOrderAssetProcedures.workOrderId, workOrderId),
				eq(workOrderAssetProcedures.assetId, assetId),
				eq(workOrderAssetProcedures.procedureId, procedureId),
			),
		)
		.returning({ procedureId: workOrderAssetProcedures.procedureId });

	if (rows.length === 0) throw notFound();
};

const partLineColumns = {
	partId: workOrderParts.partId,
	plannedQuantity: workOrderParts.plannedQuantity,
	usedQuantity: workOrderParts.usedQuantity,
};

export const getPart = async (
	organizationId: number,
	workOrderId: number,
	partId: number,
	dbc: IDB = db,
) => {
	const [row] = await dbc
		.select(partLineColumns)
		.from(workOrderParts)
		.where(
			and(
				eq(workOrderParts.organizationId, organizationId),
				eq(workOrderParts.workOrderId, workOrderId),
				eq(workOrderParts.partId, partId),
			),
		)
		.limit(1);

	if (!row) throw notFound();
	return row;
};

export const listPartLines = async (
	organizationId: number,
	workOrderId: number,
	dbc: IDB = db,
) =>
	dbc
		.select(partLineColumns)
		.from(workOrderParts)
		.where(
			and(
				eq(workOrderParts.organizationId, organizationId),
				eq(workOrderParts.workOrderId, workOrderId),
			),
		)
		.orderBy(asc(workOrderParts.partId));

export const createPart = async (
	organizationId: number,
	workOrderId: number,
	partId: number,
	plannedQuantity: number,
	dbc: IDB = db,
) => {
	await dbc
		.insert(workOrderParts)
		.values({ organizationId, workOrderId, partId, plannedQuantity });
};

export const updatePart = async (
	organizationId: number,
	workOrderId: number,
	partId: number,
	patch: { plannedQuantity?: number; usedQuantity?: number },
	dbc: IDB = db,
) => {
	const rows = await dbc
		.update(workOrderParts)
		.set(patch)
		.where(
			and(
				eq(workOrderParts.organizationId, organizationId),
				eq(workOrderParts.workOrderId, workOrderId),
				eq(workOrderParts.partId, partId),
			),
		)
		.returning({ partId: workOrderParts.partId });

	if (rows.length === 0) throw notFound();
};

export const deletePart = async (
	organizationId: number,
	workOrderId: number,
	partId: number,
	dbc: IDB = db,
) => {
	const rows = await dbc
		.delete(workOrderParts)
		.where(
			and(
				eq(workOrderParts.organizationId, organizationId),
				eq(workOrderParts.workOrderId, workOrderId),
				eq(workOrderParts.partId, partId),
			),
		)
		.returning({ partId: workOrderParts.partId });

	if (rows.length === 0) throw notFound();
};

export type WorkOrderRow = NonNullable<Awaited<ReturnType<typeof get>>>;
export type WorkOrderAssetRow = Awaited<ReturnType<typeof listAssets>>[number];
export type WorkOrderAssetProcedureRow = Awaited<
	ReturnType<typeof listAssetProcedures>
>[number];
export type WorkOrderProcedureRow = Awaited<
	ReturnType<typeof listProcedures>
>[number];
export type WorkOrderPartRow = Awaited<ReturnType<typeof listParts>>[number];
export type WorkOrderAssigneeRow = Awaited<
	ReturnType<typeof listAssignees>
>[number];
