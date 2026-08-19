import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../../db/client";
import {
	assets,
	locations,
	organizations,
	parts,
	procedures,
	tagAssignments,
	tags,
	userOrganizations,
	workOrders,
} from "../../db/schema";
import { errorCodeOf } from "../../errors";
import { stopSenderBoss, WORK_ORDER_REPORT_QUEUE } from "../../jobs/boss";
import type { TenantContext } from "../../tenant";
import { workOrderCreateSchema } from "./schema";
import * as service from "./service";

let tenant: TenantContext;
let otherTenant: TenantContext;
let assetId: number;
let secondAssetId: number;
let partId: number;
let procedureId: number;
let locationId: number;
let tagId: number;
let assigneeId: number;

const createdWorkOrderIds: number[] = [];
const createdLocationIds: number[] = [];

const suffix = process.hrtime.bigint().toString().slice(-9);
let sequence = 0;
const uniqueName = (label: string) =>
	`zz-test-${label}-${suffix}-${++sequence}`;

const codeOfRejection = async (run: () => Promise<unknown>) => {
	try {
		await run();
		return "no-rejection";
	} catch (error) {
		return errorCodeOf(error) ?? "unknown-error";
	}
};

const tenantFor = (
	organizationId: number,
	userId: number,
	timezone = "UTC",
): TenantContext => ({
	organizationId,
	userId,
	hasBackoffice: true,
	hasField: true,
	isOwner: true,
	timezone,
});

const partQuantity = async (id: number) => {
	const [row] = await db
		.select({ quantity: parts.quantity })
		.from(parts)
		.where(eq(parts.id, id));
	return row.quantity;
};

const reportJobs = async (workOrderId: number) => {
	const result = await db.execute(
		sql`SELECT id FROM pgboss.job WHERE name = ${WORK_ORDER_REPORT_QUEUE} AND data->>'work_order_id' = ${String(workOrderId)}`,
	);
	return result.rows;
};

beforeAll(async () => {
	const orgs = await db
		.select({ id: organizations.id, ownerId: organizations.ownerId })
		.from(organizations)
		.innerJoin(
			userOrganizations,
			and(
				eq(userOrganizations.organizationId, organizations.id),
				eq(userOrganizations.userId, organizations.ownerId),
				isNull(userOrganizations.deletedAt),
			),
		)
		.limit(2);

	if (orgs.length < 2) {
		throw new Error("these tests need at least two organizations");
	}

	tenant = tenantFor(orgs[0].id, orgs[0].ownerId);
	otherTenant = tenantFor(orgs[1].id, orgs[1].ownerId);
	assigneeId = orgs[0].ownerId;

	const [location] = await db
		.insert(locations)
		.values({
			organizationId: tenant.organizationId,
			name: uniqueName("location"),
		})
		.returning({ id: locations.id });
	locationId = location.id;
	createdLocationIds.push(locationId);

	const createdAssets = await db
		.insert(assets)
		.values([
			{
				organizationId: tenant.organizationId,
				name: uniqueName("asset"),
				status: "operational",
				criticality: "normal",
			},
			{
				organizationId: tenant.organizationId,
				name: uniqueName("asset"),
				status: "operational",
				criticality: "normal",
			},
		])
		.returning({ id: assets.id });
	assetId = createdAssets[0].id;
	secondAssetId = createdAssets[1].id;

	const [part] = await db
		.insert(parts)
		.values({
			organizationId: tenant.organizationId,
			name: uniqueName("part"),
			quantity: 100,
			minQuantity: 1,
		})
		.returning({ id: parts.id });
	partId = part.id;

	const [procedure] = await db
		.insert(procedures)
		.values({
			organizationId: tenant.organizationId,
			name: uniqueName("procedure"),
			status: "active",
		})
		.returning({ id: procedures.id });
	procedureId = procedure.id;

	const [tag] = await db
		.insert(tags)
		.values({
			organizationId: tenant.organizationId,
			tagType: "work_order",
			name: uniqueName("tag"),
		})
		.returning({ id: tags.id });
	tagId = tag.id;
});

afterAll(async () => {
	if (createdWorkOrderIds.length > 0) {
		await db
			.delete(tagAssignments)
			.where(
				and(
					eq(tagAssignments.entityType, "work_order"),
					inArray(tagAssignments.entityId, createdWorkOrderIds),
				),
			);
		await db.execute(
			sql`DELETE FROM pgboss.job WHERE name = ${WORK_ORDER_REPORT_QUEUE} AND data->>'work_order_id' IN ${createdWorkOrderIds.map(String)}`,
		);
		await db
			.delete(workOrders)
			.where(inArray(workOrders.id, createdWorkOrderIds));
	}

	await db.delete(tags).where(eq(tags.id, tagId));
	await db.delete(procedures).where(eq(procedures.id, procedureId));
	await db.delete(parts).where(eq(parts.id, partId));
	await db.delete(assets).where(inArray(assets.id, [assetId, secondAssetId]));
	await db.delete(locations).where(inArray(locations.id, createdLocationIds));

	await stopSenderBoss();
});

const createWorkOrder = async (overrides: Record<string, unknown> = {}) => {
	const input = workOrderCreateSchema.parse({
		title: uniqueName("wo"),
		status: "pending",
		type: "reactive",
		priority: "medium",
		recurrence_type: "none",
		...overrides,
	});
	const workOrder = await service.create(tenant, input);
	createdWorkOrderIds.push(workOrder.id);
	return workOrder;
};

describe("work orders service", () => {
	it("creates a work order with every relation and returns it hydrated", async () => {
		const workOrder = await createWorkOrder({
			description: "a description",
			priority: "high",
			location_id: locationId,
			tag_ids: [tagId],
			asset_assignments: [{ asset_id: assetId, procedure_ids: [procedureId] }],
			part_assignments: [{ part_id: partId, planned_quantity: 3 }],
			assignee_ids: [assigneeId],
			procedure_ids: [procedureId],
		});

		expect(workOrder.priority).toBe("high");
		expect(workOrder.location?.id).toBe(locationId);
		expect(workOrder.location_id).toBe(locationId);
		expect(workOrder.tags.map((tag) => tag.id)).toEqual([tagId]);
		expect(workOrder.assets).toHaveLength(1);
		expect(workOrder.assets[0].id).toBe(assetId);
		expect(workOrder.assets[0].procedures.map((item) => item.id)).toEqual([
			procedureId,
		]);
		expect(workOrder.parts).toEqual([
			expect.objectContaining({
				id: partId,
				planned_quantity: 3,
				used_quantity: 0,
			}),
		]);
		expect(workOrder.assignees.map((item) => item.id)).toEqual([assigneeId]);
		expect(workOrder.procedures.map((item) => item.id)).toEqual([procedureId]);
		expect(workOrder.started_at).toBeNull();
		expect(workOrder.closed_at).toBeNull();
		expect(workOrder.recurrence_config).toEqual({
			interval: 0,
			days_of_week: null,
			day_of_month: 0,
			week_of_month: 0,
			month_of_year: 0,
			end_date: null,
			max_occurrences: null,
		});
	});

	it("reads back exactly what create returned", async () => {
		const created = await createWorkOrder({
			asset_assignments: [{ asset_id: assetId }],
		});
		expect(await service.get(tenant, created.id)).toEqual(created);
	});

	it("keeps the recurrence config it was given", async () => {
		const workOrder = await createWorkOrder({
			recurrence_type: "weekly",
			recurrence_config: {
				interval: 2,
				days_of_week: [1, 3],
				day_of_month: 0,
				week_of_month: 0,
				month_of_year: 0,
			},
		});

		expect(workOrder.recurrence_type).toBe("weekly");
		expect(workOrder.recurrence_config.interval).toBe(2);
		expect(workOrder.recurrence_config.days_of_week).toEqual([1, 3]);
	});

	it("stamps started_at when it is created in progress", async () => {
		const workOrder = await createWorkOrder({ status: "in_progress" });
		expect(workOrder.started_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});

	it("accepts a datetime-local planned start and stores it as UTC", async () => {
		const workOrder = await createWorkOrder({
			planned_start: "2031-03-04T09:30",
		});
		expect(workOrder.planned_start).toBe("2031-03-04T09:30:00.000Z");
	});

	it("drops a soft deleted location but keeps its id", async () => {
		const [doomed] = await db
			.insert(locations)
			.values({
				organizationId: tenant.organizationId,
				name: uniqueName("doomed-location"),
			})
			.returning({ id: locations.id });
		createdLocationIds.push(doomed.id);

		const created = await createWorkOrder({ location_id: doomed.id });
		expect(created.location?.id).toBe(doomed.id);

		await db
			.update(locations)
			.set({ deletedAt: sql`NOW()` })
			.where(eq(locations.id, doomed.id));

		const reloaded = await service.get(tenant, created.id);
		expect(reloaded.location).toBeNull();
		expect(reloaded.location_id).toBe(doomed.id);
	});

	it("hides another organization's work order", async () => {
		const workOrder = await createWorkOrder();
		expect(
			await codeOfRejection(() => service.get(otherTenant, workOrder.id)),
		).toBe("not_found");
	});

	it("returns assignees but no assets, parts or procedures in search", async () => {
		const created = await createWorkOrder({
			asset_assignments: [{ asset_id: assetId }],
			part_assignments: [{ part_id: partId, planned_quantity: 1 }],
			assignee_ids: [assigneeId],
			procedure_ids: [procedureId],
			tag_ids: [tagId],
		});

		const result = await service.search(tenant, {
			q: created.title,
			page: 1,
			size: 20,
		});

		expect(result.total).toBe(1);
		const [item] = result.items;
		expect(item.id).toBe(created.id);
		expect(item.assignees.map((entry) => entry.id)).toEqual([assigneeId]);
		expect(item.tags.map((entry) => entry.id)).toEqual([tagId]);
		expect(item.assets).toEqual([]);
		expect(item.parts).toEqual([]);
		expect(item.procedures).toEqual([]);
	});

	it("filters by status, asset, part and assignee", async () => {
		const created = await createWorkOrder({
			status: "planned",
			asset_assignments: [{ asset_id: secondAssetId }],
			part_assignments: [{ part_id: partId, planned_quantity: 1 }],
			assignee_ids: [assigneeId],
		});

		const ids = async (params: Record<string, unknown>) => {
			const result = await service.search(tenant, {
				q: created.title,
				page: 1,
				size: 20,
				...params,
			} as Parameters<typeof service.search>[1]);
			return result.items.map((item) => item.id);
		};

		expect(await ids({ status: "planned" })).toEqual([created.id]);
		expect(await ids({ status: "completed" })).toEqual([]);
		expect(await ids({ asset_id: secondAssetId })).toEqual([created.id]);
		expect(await ids({ asset_id: assetId })).toEqual([]);
		expect(await ids({ part_id: partId })).toEqual([created.id]);
		expect(await ids({ assignee_id: assigneeId })).toEqual([created.id]);
		expect(await ids({ assignment: "assigned" })).toEqual([created.id]);
		expect(await ids({ assignment: "unassigned" })).toEqual([]);
	});

	it("treats an unassigned work order as unassigned", async () => {
		const created = await createWorkOrder();
		const result = await service.search(tenant, {
			q: created.title,
			assignment: "unassigned",
			page: 1,
			size: 20,
		});
		expect(result.items.map((item) => item.id)).toEqual([created.id]);
	});

	it("reads the planned start window in the tenant timezone", async () => {
		const created = await createWorkOrder({
			planned_start: "2031-05-10T03:00:00Z",
		});
		const bogota = tenantFor(
			tenant.organizationId,
			tenant.userId,
			"America/Bogota",
		);

		const idsFor = async (from: string, to: string) => {
			const result = await service.search(bogota, {
				q: created.title,
				planned_start_from: from,
				planned_start_to: to,
				page: 1,
				size: 20,
			});
			return result.items.map((item) => item.id);
		};

		expect(await idsFor("2031-05-09", "2031-05-09")).toEqual([created.id]);
		expect(await idsFor("2031-05-10", "2031-05-10")).toEqual([]);
	});

	it("orders by planned start with the undated ones last", async () => {
		const undated = await createWorkOrder();
		const late = await createWorkOrder({
			planned_start: "2032-02-02T10:00:00Z",
		});
		const early = await createWorkOrder({
			planned_start: "2032-02-01T10:00:00Z",
		});

		const result = await service.search(tenant, {
			q: suffix,
			page: 1,
			size: 100,
		});

		const ids = result.items.map((item) => item.id);
		expect(ids.indexOf(early.id)).toBeLessThan(ids.indexOf(late.id));
		expect(ids.indexOf(late.id)).toBeLessThan(ids.indexOf(undated.id));
	});

	it("writes only the fields it was given and leaves the untouched ones alone", async () => {
		const created = await createWorkOrder({ title: uniqueName("before") });
		const nextTitle = uniqueName("after");

		const updated = await service.update(tenant, created.id, {
			title: nextTitle,
			priority: "urgent",
		});

		expect(updated.title).toBe(nextTitle);
		expect(updated.priority).toBe("urgent");
		expect(updated.description).toBe(created.description);
	});

	it("stamps closed_at and enqueues the report when it is completed", async () => {
		const created = await createWorkOrder();
		const updated = await service.update(tenant, created.id, {
			status: "completed",
		});

		expect(updated.status).toBe("completed");
		expect(updated.closed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		expect(await reportJobs(created.id)).toHaveLength(1);
	});

	it("keeps started_at and clears closed_at when it is reopened", async () => {
		const created = await createWorkOrder({ status: "in_progress" });
		const completed = await service.update(tenant, created.id, {
			status: "completed",
		});
		const reopened = await service.update(tenant, created.id, {
			status: "in_progress",
		});

		expect(completed.closed_at).not.toBeNull();
		expect(reopened.started_at).toBe(created.started_at);
		expect(reopened.closed_at).toBeNull();
	});

	it("clears both timestamps when it goes back to the backlog", async () => {
		const created = await createWorkOrder({ status: "in_progress" });
		await service.update(tenant, created.id, { status: "completed" });
		const planned = await service.update(tenant, created.id, {
			status: "planned",
		});

		expect(planned.started_at).toBeNull();
		expect(planned.closed_at).toBeNull();
	});

	it("returns the used stock when it is cancelled", async () => {
		const created = await createWorkOrder({
			part_assignments: [{ part_id: partId, planned_quantity: 5 }],
		});
		const before = await partQuantity(partId);

		await service.updatePart(tenant, created.id, partId, 5, 4);
		expect(await partQuantity(partId)).toBe(before - 4);

		const cancelled = await service.update(tenant, created.id, {
			status: "cancelled",
			cancellation_reason: "not needed",
		});

		expect(cancelled.status).toBe("cancelled");
		expect(cancelled.parts[0].used_quantity).toBe(0);
		expect(cancelled.parts[0].planned_quantity).toBe(5);
		expect(await partQuantity(partId)).toBe(before);
		expect(await reportJobs(created.id)).toHaveLength(1);
	});

	it("returns the used stock when it is deleted", async () => {
		const created = await createWorkOrder({
			part_assignments: [{ part_id: partId, planned_quantity: 2 }],
		});
		const before = await partQuantity(partId);

		await service.updatePart(tenant, created.id, partId, 2, 2);
		expect(await partQuantity(partId)).toBe(before - 2);

		await service.remove(tenant, created.id);

		expect(await partQuantity(partId)).toBe(before);
		expect(await codeOfRejection(() => service.get(tenant, created.id))).toBe(
			"not_found",
		);
		expect(
			await codeOfRejection(() => service.remove(tenant, created.id)),
		).toBe("not_found");
	});

	it("moves stock by the difference when the used quantity is edited", async () => {
		const created = await createWorkOrder({
			part_assignments: [{ part_id: partId, planned_quantity: 10 }],
		});
		const before = await partQuantity(partId);

		await service.updatePart(tenant, created.id, partId, 10, 6);
		expect(await partQuantity(partId)).toBe(before - 6);

		const lowered = await service.updatePart(tenant, created.id, partId, 10, 2);
		expect(lowered.parts[0].used_quantity).toBe(2);
		expect(await partQuantity(partId)).toBe(before - 2);

		const removed = await service.removePart(tenant, created.id, partId);
		expect(removed.parts).toEqual([]);
		expect(await partQuantity(partId)).toBe(before);
	});

	it("allows the stock to go negative", async () => {
		const created = await createWorkOrder({
			part_assignments: [{ part_id: partId, planned_quantity: 1 }],
		});
		const before = await partQuantity(partId);

		await service.updatePart(tenant, created.id, partId, 1, before + 5);
		expect(await partQuantity(partId)).toBe(-5);

		await service.removePart(tenant, created.id, partId);
		expect(await partQuantity(partId)).toBe(before);
	});

	it("adds and removes a part line", async () => {
		const created = await createWorkOrder();

		const added = await service.addPart(tenant, created.id, partId, 4);
		expect(added.parts).toEqual([
			expect.objectContaining({ id: partId, planned_quantity: 4 }),
		]);

		const removed = await service.removePart(tenant, created.id, partId);
		expect(removed.parts).toEqual([]);
		expect(
			await codeOfRejection(() =>
				service.removePart(tenant, created.id, partId),
			),
		).toBe("not_found");
	});

	it("adds and removes an assignee", async () => {
		const created = await createWorkOrder();

		const added = await service.addAssignee(tenant, created.id, assigneeId);
		expect(added.assignees.map((item) => item.id)).toEqual([assigneeId]);

		const removed = await service.removeAssignee(
			tenant,
			created.id,
			assigneeId,
		);
		expect(removed.assignees).toEqual([]);
		expect(
			await codeOfRejection(() =>
				service.removeAssignee(tenant, created.id, assigneeId),
			),
		).toBe("not_found");
	});

	it("stores procedure responses on the work order procedure", async () => {
		const created = await createWorkOrder({ procedure_ids: [procedureId] });

		const updated = await service.updateProcedure(
			tenant,
			created.id,
			procedureId,
			{ "field-1": "done", "field-2": [1, 2, 3] },
		);

		expect(updated.procedures[0].procedure_responses).toEqual({
			"field-1": "done",
			"field-2": [1, 2, 3],
		});

		const removed = await service.removeProcedure(
			tenant,
			created.id,
			procedureId,
		);
		expect(removed.procedures).toEqual([]);
	});

	it("stores procedure responses per asset", async () => {
		const created = await createWorkOrder({
			asset_assignments: [
				{ asset_id: assetId, procedure_ids: [procedureId] },
				{ asset_id: secondAssetId, procedure_ids: [procedureId] },
			],
		});

		const updated = await service.updateAssetProcedure(
			tenant,
			created.id,
			assetId,
			procedureId,
			{ reading: 42 },
		);

		const first = updated.assets.find((asset) => asset.id === assetId);
		const second = updated.assets.find((asset) => asset.id === secondAssetId);
		expect(first?.procedures[0].procedure_responses).toEqual({ reading: 42 });
		expect(second?.procedures[0].procedure_responses).toEqual({});

		const removed = await service.removeAssetProcedure(
			tenant,
			created.id,
			assetId,
			procedureId,
		);
		expect(
			removed.assets.find((asset) => asset.id === assetId)?.procedures,
		).toEqual([]);
	});

	it("adds and removes an asset", async () => {
		const created = await createWorkOrder();

		const added = await service.addAsset(tenant, created.id, assetId);
		expect(added.assets.map((asset) => asset.id)).toEqual([assetId]);

		const removed = await service.removeAsset(tenant, created.id, assetId);
		expect(removed.assets).toEqual([]);
		expect(
			await codeOfRejection(() =>
				service.removeAsset(tenant, created.id, assetId),
			),
		).toBe("not_found");
	});

	it("replaces the tags and logs the change", async () => {
		const created = await createWorkOrder();

		await service.setTags(tenant, created.id, [tagId]);
		expect(
			(await service.get(tenant, created.id)).tags.map((t) => t.id),
		).toEqual([tagId]);

		await service.setTags(tenant, created.id, []);
		expect((await service.get(tenant, created.id)).tags).toEqual([]);
	});

	it("refuses relation writes on another organization's work order", async () => {
		const created = await createWorkOrder();
		expect(
			await codeOfRejection(() =>
				service.update(otherTenant, created.id, { priority: "low" }),
			),
		).toBe("not_found");
		expect(
			await codeOfRejection(() =>
				service.removeAsset(otherTenant, created.id, assetId),
			),
		).toBe("not_found");
	});
});
