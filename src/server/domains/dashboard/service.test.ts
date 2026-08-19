import { isNull } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "../../db/client";
import { userOrganizations } from "../../db/schema";
import type { TenantContext } from "../../tenant";
import * as service from "./service";

let tenant: TenantContext;

beforeAll(async () => {
	const [membership] = await db
		.select({ organizationId: userOrganizations.organizationId })
		.from(userOrganizations)
		.where(isNull(userOrganizations.deletedAt))
		.limit(1);

	if (!membership) throw new Error("no organization available");

	tenant = {
		organizationId: membership.organizationId,
		userId: 0,
		hasBackoffice: true,
		hasField: true,
		isOwner: true,
		timezone: "America/Bogota",
	};
});

describe("dashboard summary", () => {
	it("returns six trend months in calendar order", async () => {
		const result = await service.summary(tenant);

		expect(result.work_order_trend).toHaveLength(6);
		const keys = result.work_order_trend.map((point) => point.month);
		expect([...keys].sort()).toEqual(keys);
		for (const key of keys) expect(key).toMatch(/^\d{4}-\d{2}$/);
	});

	it("keeps the kpi totals consistent with the group counts", async () => {
		const result = await service.summary(tenant);

		const statusTotal = result.work_orders_by_status.reduce(
			(sum, row) => sum + row.count,
			0,
		);
		expect(result.kpis.total_work_orders).toBe(statusTotal);
		expect(result.kpis.open_work_orders).toBeLessThanOrEqual(statusTotal);

		const assetTotal = result.assets_by_status.reduce(
			(sum, row) => sum + row.count,
			0,
		);
		expect(result.kpis.total_assets).toBe(assetTotal);
		expect(result.kpis.low_stock_parts).toBeLessThanOrEqual(
			result.kpis.total_parts,
		);
	});

	it("groups by timezone without a duplicated bound parameter", async () => {
		const utc = await service.summary({ ...tenant, timezone: "UTC" });
		const tokyo = await service.summary({ ...tenant, timezone: "Asia/Tokyo" });

		const sum = (points: { created: number }[]) =>
			points.reduce((total, point) => total + point.created, 0);

		expect(sum(utc.work_order_trend)).toBeGreaterThanOrEqual(0);
		expect(sum(tokyo.work_order_trend)).toBeGreaterThanOrEqual(0);
	});
});
