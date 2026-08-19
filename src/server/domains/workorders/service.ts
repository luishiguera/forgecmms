import { db, type IDB, toISO } from "../../db/client";
import type { RecurrenceConfig } from "../../db/schema";
import { notFound } from "../../errors";
import { enqueueWorkOrderReport } from "../../jobs/reports";
import type { TenantContext } from "../../tenant";
import { type Paginated, paginate } from "../_shared/schema";
import { startOfDay, startOfNextDay } from "../_shared/time";
import { adjustStock } from "../parts/repository";
import { setEntityTags, tagsForEntities } from "../tags/repository";
import type {
	WorkOrderAssetProcedureRow,
	WorkOrderAssetRow,
	WorkOrderAssigneeRow,
	WorkOrderPartRow,
	WorkOrderProcedureRow,
	WorkOrderRow,
} from "./repository";
import * as repository from "./repository";
import type {
	ProcedureResponses,
	WorkOrderCreateInput,
	WorkOrderPartItemResponse,
	WorkOrderProcedureItemResponse,
	WorkOrderResponse,
	WorkOrderSearchParams,
	WorkOrderUpdateInput,
	WorkOrderUserItemResponse,
} from "./schema";

type Relations = {
	tags: WorkOrderResponse["tags"];
	assets: WorkOrderAssetRow[];
	assetProcedures: WorkOrderAssetProcedureRow[];
	parts: WorkOrderPartRow[];
	assignees: WorkOrderAssigneeRow[];
	procedures: WorkOrderProcedureRow[];
};

const emptyRelations: Relations = {
	tags: [],
	assets: [],
	assetProcedures: [],
	parts: [],
	assignees: [],
	procedures: [],
};

const toRecurrenceConfig = (
	value: Partial<RecurrenceConfig>,
): RecurrenceConfig => ({
	interval: value.interval ?? 0,
	days_of_week: value.days_of_week ?? null,
	day_of_month: value.day_of_month ?? 0,
	week_of_month: value.week_of_month ?? 0,
	month_of_year: value.month_of_year ?? 0,
	end_date: value.end_date ?? null,
	max_occurrences: value.max_occurrences ?? null,
});

const toProcedureItem = (
	row: WorkOrderProcedureRow | WorkOrderAssetProcedureRow,
): WorkOrderProcedureItemResponse => ({
	id: row.id,
	name: row.name,
	description: row.description,
	procedure_responses: row.procedureResponses,
});

const toPartItem = (row: WorkOrderPartRow): WorkOrderPartItemResponse => ({
	id: row.id,
	name: row.name,
	sku: row.sku,
	image_url: row.imageUrl,
	planned_quantity: row.plannedQuantity,
	used_quantity: row.usedQuantity,
});

const toUserItem = (row: WorkOrderAssigneeRow): WorkOrderUserItemResponse => ({
	id: row.id,
	full_name: row.fullName,
	photo_url: row.photoUrl,
	email: row.email,
});

const toResponse = (
	row: WorkOrderRow,
	relations: Relations,
): WorkOrderResponse => {
	const proceduresByAsset = new Map<number, WorkOrderProcedureItemResponse[]>();
	for (const assetProcedure of relations.assetProcedures) {
		const list = proceduresByAsset.get(assetProcedure.assetId) ?? [];
		list.push(toProcedureItem(assetProcedure));
		proceduresByAsset.set(assetProcedure.assetId, list);
	}

	return {
		id: row.id,
		title: row.title,
		description: row.description,
		status: row.status,
		type: row.type,
		priority: row.priority,
		planned_start: toISO(row.plannedStart),
		planned_end: toISO(row.plannedEnd),
		started_at: toISO(row.startedAt),
		closed_at: toISO(row.closedAt),
		cancellation_reason: row.cancellationReason,
		location_id: row.locationId,
		location: row.location?.id
			? {
					id: row.location.id,
					name: row.location.name,
					address: row.location.address,
					image_url: row.location.imageUrl,
					latitude: row.location.latitude,
					longitude: row.location.longitude,
					phones: row.location.phones ?? [],
					business: row.business?.id
						? {
								id: row.business.id,
								name: row.business.name,
								type: row.business.type,
								phones: row.business.phones ?? [],
								emails: row.business.emails ?? [],
							}
						: null,
				}
			: null,
		recurrence_type: row.recurrenceType,
		recurrence_config: toRecurrenceConfig(row.recurrenceConfig),
		parent_work_order_id: row.parentWorkOrderId,
		report_url: row.reportUrl,
		report_generated_at: toISO(row.reportGeneratedAt),
		created_at: toISO(row.createdAt),
		updated_at: toISO(row.updatedAt),
		tags: relations.tags,
		assets: relations.assets.map((asset) => ({
			id: asset.id,
			name: asset.name,
			serial_number: asset.serialNumber,
			image_url: asset.imageUrl,
			status: asset.status,
			criticality: asset.criticality,
			location_id: asset.locationId,
			assignment_status: asset.assignmentStatus,
			procedures: proceduresByAsset.get(asset.id) ?? [],
		})),
		parts: relations.parts.map(toPartItem),
		assignees: relations.assignees.map(toUserItem),
		procedures: relations.procedures.map(toProcedureItem),
	};
};

const returnUsedStock = async (
	tc: TenantContext,
	workOrderId: number,
	dbc: IDB,
) => {
	const lines = await repository.listPartLines(
		tc.organizationId,
		workOrderId,
		dbc,
	);

	for (const line of lines) {
		if (line.usedQuantity === 0) continue;
		await adjustStock(tc.organizationId, line.partId, line.usedQuantity, dbc);
		await repository.updatePart(
			tc.organizationId,
			workOrderId,
			line.partId,
			{ usedQuantity: 0 },
			dbc,
		);
	}
};

export const get = async (
	tc: TenantContext,
	workOrderId: number,
): Promise<WorkOrderResponse> => {
	const row = await repository.get(tc.organizationId, workOrderId);
	if (!row) throw notFound();

	const [tags, assets, assetProcedures, parts, assignees, procedures] =
		await Promise.all([
			tagsForEntities(tc.organizationId, "work_order", [row.id]),
			repository.listAssets(tc.organizationId, row.id),
			repository.listAssetProcedures(tc.organizationId, row.id),
			repository.listParts(tc.organizationId, row.id),
			repository.listAssignees(tc.organizationId, [row.id]),
			repository.listProcedures(tc.organizationId, row.id),
		]);

	return toResponse(row, {
		tags: tags.get(row.id) ?? [],
		assets,
		assetProcedures,
		parts,
		assignees,
		procedures,
	});
};

export const search = async (
	tc: TenantContext,
	params: WorkOrderSearchParams,
): Promise<Paginated<WorkOrderResponse>> => {
	const { rows, total } = await repository.search(tc.organizationId, {
		...params,
		plannedStartFrom: params.planned_start_from
			? startOfDay(params.planned_start_from, tc.timezone)
			: undefined,
		plannedStartTo: params.planned_start_to
			? startOfNextDay(params.planned_start_to, tc.timezone)
			: undefined,
	});

	const ids = rows.map((row) => row.id);
	const [tags, assignees] = await Promise.all([
		tagsForEntities(tc.organizationId, "work_order", ids),
		repository.listAssignees(tc.organizationId, ids),
	]);

	const assigneesByWorkOrder = new Map<number, WorkOrderAssigneeRow[]>();
	for (const assignee of assignees) {
		const list = assigneesByWorkOrder.get(assignee.workOrderId) ?? [];
		list.push(assignee);
		assigneesByWorkOrder.set(assignee.workOrderId, list);
	}

	return paginate(
		rows.map((row) =>
			toResponse(row, {
				...emptyRelations,
				tags: tags.get(row.id) ?? [],
				assignees: assigneesByWorkOrder.get(row.id) ?? [],
			}),
		),
		params,
		total,
	);
};

export const create = async (
	tc: TenantContext,
	input: WorkOrderCreateInput,
): Promise<WorkOrderResponse> => {
	const workOrderId = await db.transaction(async (tx) => {
		const id = await repository.create(
			{
				organizationId: tc.organizationId,
				title: input.title,
				description: input.description,
				status: input.status,
				type: input.type,
				priority: input.priority,
				plannedStart: input.planned_start ?? null,
				plannedEnd: input.planned_end ?? null,
				startedAt: input.status === "in_progress" ? new Date() : null,
				locationId: input.location_id ?? null,
				recurrenceType: input.recurrence_type,
				recurrenceConfig: input.recurrence_config ?? {},
			},
			tx,
		);

		if (input.tag_ids?.length) {
			await setEntityTags(
				tc.organizationId,
				"work_order",
				id,
				input.tag_ids,
				tx,
			);
		}

		for (const assignment of input.asset_assignments ?? []) {
			await repository.createAsset(
				tc.organizationId,
				id,
				assignment.asset_id,
				tx,
			);
			for (const procedureId of assignment.procedure_ids ?? []) {
				await repository.createAssetProcedure(
					tc.organizationId,
					id,
					assignment.asset_id,
					procedureId,
					tx,
				);
			}
		}

		for (const assignment of input.part_assignments ?? []) {
			await repository.createPart(
				tc.organizationId,
				id,
				assignment.part_id,
				assignment.planned_quantity,
				tx,
			);
		}

		for (const userId of input.assignee_ids ?? []) {
			await repository.createAssignee(tc.organizationId, id, userId, tx);
		}

		for (const procedureId of input.procedure_ids ?? []) {
			await repository.createProcedure(tc.organizationId, id, procedureId, tx);
		}

		return id;
	});

	return get(tc, workOrderId);
};

export const update = async (
	tc: TenantContext,
	workOrderId: number,
	input: WorkOrderUpdateInput,
): Promise<WorkOrderResponse> => {
	const existing = await repository.get(tc.organizationId, workOrderId);
	if (!existing) throw notFound();

	const isClosing =
		input.status === "completed" || input.status === "cancelled";
	const isCancelling =
		input.status === "cancelled" && existing.status !== "cancelled";
	const isBacklog =
		input.status === "pending" ||
		input.status === "reviewing" ||
		input.status === "planned";
	const now = new Date();

	const patch: repository.WorkOrderPatch = {};
	if (input.title !== undefined) patch.title = input.title;
	if (input.description !== undefined) patch.description = input.description;
	if (input.status !== undefined) patch.status = input.status;
	if (input.type !== undefined) patch.type = input.type;
	if (input.priority !== undefined) patch.priority = input.priority;
	if (input.planned_start !== undefined)
		patch.plannedStart = input.planned_start;
	if (input.planned_end !== undefined) patch.plannedEnd = input.planned_end;
	if (input.cancellation_reason !== undefined)
		patch.cancellationReason = input.cancellation_reason;
	if ("location_id" in input) patch.locationId = input.location_id ?? null;
	if (input.recurrence_type !== undefined)
		patch.recurrenceType = input.recurrence_type;
	if (input.recurrence_config !== undefined)
		patch.recurrenceConfig = input.recurrence_config;
	if (input.status === "in_progress") {
		patch.startedAt = existing.startedAt ?? now;
		patch.closedAt = null;
	}
	if (isBacklog) {
		patch.startedAt = null;
		patch.closedAt = null;
	}
	if (isClosing) patch.closedAt = now;

	await db.transaction(async (tx) => {
		await repository.update(tc.organizationId, workOrderId, patch, tx);

		if (isCancelling) {
			await returnUsedStock(tc, workOrderId, tx);
		}

		if (isClosing) {
			await enqueueWorkOrderReport(tc.organizationId, workOrderId, tx);
		}
	});

	return get(tc, workOrderId);
};

export const remove = async (tc: TenantContext, workOrderId: number) => {
	await db.transaction(async (tx) => {
		await returnUsedStock(tc, workOrderId, tx);
		await repository.softDelete(tc.organizationId, workOrderId, tx);
	});
};

export const setTags = async (
	tc: TenantContext,
	workOrderId: number,
	tagIds: number[],
) => {
	await db.transaction(async (tx) => {
		await setEntityTags(
			tc.organizationId,
			"work_order",
			workOrderId,
			tagIds,
			tx,
		);
	});
};

export const addAsset = async (
	tc: TenantContext,
	workOrderId: number,
	assetId: number,
) => {
	await repository.createAsset(tc.organizationId, workOrderId, assetId);

	return get(tc, workOrderId);
};

export const removeAsset = async (
	tc: TenantContext,
	workOrderId: number,
	assetId: number,
) => {
	await repository.deleteAsset(tc.organizationId, workOrderId, assetId);

	return get(tc, workOrderId);
};

export const addAssetProcedure = async (
	tc: TenantContext,
	workOrderId: number,
	assetId: number,
	procedureId: number,
) => {
	await repository.createAssetProcedure(
		tc.organizationId,
		workOrderId,
		assetId,
		procedureId,
	);

	return get(tc, workOrderId);
};

export const updateAssetProcedure = async (
	tc: TenantContext,
	workOrderId: number,
	assetId: number,
	procedureId: number,
	responses: ProcedureResponses,
) => {
	await repository.updateAssetProcedureResponses(
		tc.organizationId,
		workOrderId,
		assetId,
		procedureId,
		responses,
	);

	return get(tc, workOrderId);
};

export const removeAssetProcedure = async (
	tc: TenantContext,
	workOrderId: number,
	assetId: number,
	procedureId: number,
) => {
	await repository.deleteAssetProcedure(
		tc.organizationId,
		workOrderId,
		assetId,
		procedureId,
	);

	return get(tc, workOrderId);
};

export const addPart = async (
	tc: TenantContext,
	workOrderId: number,
	partId: number,
	plannedQuantity: number,
) => {
	await repository.createPart(
		tc.organizationId,
		workOrderId,
		partId,
		plannedQuantity,
	);

	return get(tc, workOrderId);
};

export const updatePart = async (
	tc: TenantContext,
	workOrderId: number,
	partId: number,
	plannedQuantity: number,
	usedQuantity: number,
) => {
	const line = await repository.getPart(tc.organizationId, workOrderId, partId);
	const delta = usedQuantity - line.usedQuantity;

	await db.transaction(async (tx) => {
		if (delta !== 0) {
			await adjustStock(tc.organizationId, partId, -delta, tx);
		}
		await repository.updatePart(
			tc.organizationId,
			workOrderId,
			partId,
			{ plannedQuantity, usedQuantity },
			tx,
		);
	});

	return get(tc, workOrderId);
};

export const removePart = async (
	tc: TenantContext,
	workOrderId: number,
	partId: number,
) => {
	const line = await repository.getPart(tc.organizationId, workOrderId, partId);

	await db.transaction(async (tx) => {
		if (line.usedQuantity !== 0) {
			await adjustStock(tc.organizationId, partId, line.usedQuantity, tx);
		}
		await repository.deletePart(tc.organizationId, workOrderId, partId, tx);
	});

	return get(tc, workOrderId);
};

export const addAssignee = async (
	tc: TenantContext,
	workOrderId: number,
	userId: number,
) => {
	await repository.createAssignee(tc.organizationId, workOrderId, userId);

	return get(tc, workOrderId);
};

export const removeAssignee = async (
	tc: TenantContext,
	workOrderId: number,
	userId: number,
) => {
	await repository.deleteAssignee(tc.organizationId, workOrderId, userId);

	return get(tc, workOrderId);
};

export const addProcedure = async (
	tc: TenantContext,
	workOrderId: number,
	procedureId: number,
) => {
	await repository.createProcedure(tc.organizationId, workOrderId, procedureId);

	return get(tc, workOrderId);
};

export const updateProcedure = async (
	tc: TenantContext,
	workOrderId: number,
	procedureId: number,
	responses: ProcedureResponses,
) => {
	await repository.updateProcedureResponses(
		tc.organizationId,
		workOrderId,
		procedureId,
		responses,
	);

	return get(tc, workOrderId);
};

export const removeProcedure = async (
	tc: TenantContext,
	workOrderId: number,
	procedureId: number,
) => {
	await repository.deleteProcedure(tc.organizationId, workOrderId, procedureId);

	return get(tc, workOrderId);
};
