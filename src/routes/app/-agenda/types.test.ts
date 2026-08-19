import { describe, expect, it } from "vitest";
import type { ScheduleBlockResponse } from "@/server/domains/schedule/schema";
import type { WorkOrderResponse } from "@/server/domains/workorders/schema";
import {
	type AgendaFilter,
	durationMinutes,
	fromScheduleBlock,
	fromWorkOrder,
	hasActiveFilters,
} from "./types";

const workOrder = (
	overrides: Partial<WorkOrderResponse> = {},
): WorkOrderResponse =>
	({
		id: 7,
		title: "Replace the belt",
		description: "",
		status: "planned",
		type: "reactive",
		priority: "high",
		planned_start: "2026-03-18T09:00:00Z",
		planned_end: "2026-03-18T11:30:00Z",
		started_at: null,
		closed_at: null,
		location: null,
		tags: [],
		assets: [],
		parts: [],
		assignees: [],
		procedures: [],
		...overrides,
	}) as WorkOrderResponse;

const scheduleBlock = (
	overrides: Partial<ScheduleBlockResponse> = {},
): ScheduleBlockResponse => ({
	id: 3,
	user_id: 1,
	type: "break",
	start_time: "2026-03-18T12:00:00Z",
	end_time: "2026-03-18T12:30:00Z",
	note: "",
	created_at: "2026-03-01T00:00:00Z",
	...overrides,
});

describe("fromWorkOrder", () => {
	it("drops a work order with no planned start", () => {
		expect(fromWorkOrder(workOrder({ planned_start: null }))).toBeNull();
	});

	it("assumes one hour when the planned end is missing", () => {
		const block = fromWorkOrder(workOrder({ planned_end: null }));
		expect(durationMinutes(block!)).toBe(60);
	});

	it("carries the fields the card shows", () => {
		const block = fromWorkOrder(
			workOrder({
				description: "Belt is worn",
				started_at: "2026-03-18T09:12:00Z",
				tags: [{ id: 1, name: "urgent" }] as WorkOrderResponse["tags"],
				assets: [{ name: "Press 4" }] as WorkOrderResponse["assets"],
				location: {
					name: "Plant 1",
					address: "Main street 3",
				} as WorkOrderResponse["location"],
			}),
		);
		expect(block).toMatchObject({
			type: "work_order",
			status: "planned",
			priority: "high",
			description: "Belt is worn",
			assetName: "Press 4",
			locationName: "Plant 1",
			locationAddress: "Main street 3",
			tags: ["urgent"],
		});
		expect(block?.actualStart?.toISOString()).toBe("2026-03-18T09:12:00.000Z");
		expect(block?.actualEnd).toBeUndefined();
		expect(durationMinutes(block!)).toBe(150);
	});

	it("leaves an empty description out instead of showing a blank line", () => {
		expect(fromWorkOrder(workOrder())?.description).toBeUndefined();
	});
});

const filter = (overrides: Partial<AgendaFilter> = {}): AgendaFilter => ({
	assigned: true,
	...overrides,
});

describe("the agenda filter", () => {
	it("marks the chip once the day is not only my own work orders", () => {
		expect(hasActiveFilters(filter({ assigned: false }))).toBe(true);
		expect(hasActiveFilters(filter())).toBe(false);
	});
});

describe("fromScheduleBlock", () => {
	it("falls back to the type label when the note is blank", () => {
		expect(fromScheduleBlock(scheduleBlock({ note: "   " })).title).not.toBe(
			"",
		);
	});

	it("keeps the note as the title", () => {
		expect(fromScheduleBlock(scheduleBlock({ note: "Lunch" })).title).toBe(
			"Lunch",
		);
	});

	it("treats an unknown type as a plain block", () => {
		expect(fromScheduleBlock(scheduleBlock({ type: "nonsense" })).type).toBe(
			"block",
		);
	});
});
