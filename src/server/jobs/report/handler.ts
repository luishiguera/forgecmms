import { randomUUID } from "node:crypto";
import { db } from "../../db/client";
import * as locationsRepository from "../../domains/locations/repository";
import * as organizationsRepository from "../../domains/organizations/repository";
import * as proceduresRepository from "../../domains/procedures/repository";
import { isFieldBlock } from "../../domains/procedures/schema";
import * as usersRepository from "../../domains/users/repository";
import * as workOrdersRepository from "../../domains/workorders/repository";
import type { JsonValue } from "../../json";
import * as storage from "../../storage";
import { newRenderCtx } from "./format";
import { dataUrlOf, fetchEmbeddable } from "./images";
import { renderReport } from "./render";
import type { OrgData, ProcedureBlock, WorkOrderData } from "./schema";

export type WorkOrderReportPayload = {
	organization_id: number;
	work_order_id: number;
};

const loadLogo = async (logoUrl: string) => {
	if (!logoUrl) return undefined;

	try {
		return dataUrlOf(await fetchEmbeddable(logoUrl));
	} catch (error) {
		console.warn(
			"workorder report: logo fetch failed, omitting",
			logoUrl,
			error,
		);
		return undefined;
	}
};

export const handleWorkOrderReport = async (
	payload: WorkOrderReportPayload,
) => {
	const organizationId = payload.organization_id;
	const workOrderId = payload.work_order_id;

	const row = await workOrdersRepository.get(organizationId, workOrderId);
	if (!row) {
		console.warn(
			"workorder report: work order not found, skipping",
			workOrderId,
			organizationId,
		);
		return;
	}

	const organization = await organizationsRepository.get(organizationId);
	if (!organization)
		throw new Error("workorder report: organization not found");

	const owner = await usersRepository.get(organization.ownerId);
	if (!owner) throw new Error("workorder report: owner not found");

	const rc = newRenderCtx(owner.language, owner.timezone);

	const [assets, assetProcedures, parts, assignees, procedures] =
		await Promise.all([
			workOrdersRepository.listAssets(organizationId, workOrderId),
			workOrdersRepository.listAssetProcedures(organizationId, workOrderId),
			workOrdersRepository.listParts(organizationId, workOrderId),
			workOrdersRepository.listAssignees(organizationId, [workOrderId]),
			workOrdersRepository.listProcedures(organizationId, workOrderId),
		]);

	const procedureIds = [
		...procedures.map((procedure) => procedure.id),
		...assetProcedures.map((procedure) => procedure.id),
	];
	const definitions = await proceduresRepository.getByIds(
		organizationId,
		procedureIds,
	);
	const fieldsById = new Map(
		definitions.map((definition) => [
			definition.id,
			definition.fields.filter(isFieldBlock),
		]),
	);

	const toBlock = (procedure: {
		id: number;
		name: string;
		procedureResponses: Record<string, JsonValue>;
	}): ProcedureBlock => ({
		name: procedure.name,
		fields: fieldsById.get(procedure.id) ?? [],
		responses: procedure.procedureResponses,
	});

	const location = row.locationId
		? await locationsRepository.get(organizationId, row.locationId)
		: undefined;

	const data: WorkOrderData = {
		id: row.id,
		title: row.title,
		description: row.description,
		status: row.status,
		type: row.type,
		priority: row.priority,
		plannedStart: row.plannedStart?.toISOString() ?? null,
		plannedEnd: row.plannedEnd?.toISOString() ?? null,
		startedAt: row.startedAt?.toISOString() ?? null,
		closedAt: row.closedAt?.toISOString() ?? null,
		cancellationReason: row.cancellationReason,
		location: location
			? {
					name: location.name,
					address: location.address,
					city: location.city,
					state: location.state,
					postalCode: location.postalCode,
					country: location.country,
				}
			: null,
		parts: parts.map((part) => ({
			name: part.name,
			sku: part.sku,
			quantity: part.plannedQuantity,
			consumed: part.usedQuantity,
		})),
		assets: assets.map((asset) => ({
			name: asset.name,
			serial: asset.serialNumber,
			status: asset.status,
			procedures: assetProcedures
				.filter((procedure) => procedure.assetId === asset.id)
				.map(toBlock),
		})),
		assignees: assignees.map((assignee) => assignee.fullName),
		procedures: procedures.map(toBlock),
	};

	const org: OrgData = {
		name: organization.name,
		legalName: organization.legalName,
		taxId: organization.taxId,
		address: organization.address,
		city: organization.city,
		state: organization.state,
		postalCode: organization.postalCode,
		country: organization.country,
		email: organization.email,
		phone: organization.phone,
	};

	const { buffer, warnings } = await renderReport(
		org,
		data,
		await loadLogo(organization.logoUrl),
		rc,
	);

	for (const warning of warnings) {
		console.warn("workorder report: image skipped", workOrderId, warning);
	}

	const path = `organizations/${organizationId}/work-order-reports/${randomUUID()}.pdf`;
	await storage.upload(path, "application/pdf", buffer);

	await workOrdersRepository.update(
		organizationId,
		workOrderId,
		{ reportUrl: storage.publicURL(path), reportGeneratedAt: new Date() },
		db,
	);

	const previous = row.reportUrl ? storage.pathOf(row.reportUrl) : "";
	if (previous && previous !== path) {
		try {
			await storage.remove(previous);
		} catch (error) {
			console.warn(
				"workorder report: previous file not removed",
				previous,
				error,
			);
		}
	}
};
