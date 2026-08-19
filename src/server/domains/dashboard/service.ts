import { assets, workOrders } from "../../db/schema";
import type { TenantContext } from "../../tenant";
import { safeTimezone } from "../_shared/time";
import * as repository from "./repository";
import type { DashboardSummaryResponse, TrendPoint } from "./schema";

const TREND_MONTHS = 6;

const zonedParts = (date: Date, timezone: string) => {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
	});
	const [{ value: year }, , { value: month }] = formatter.formatToParts(date);
	return { year: Number(year), month: Number(month) };
};

const monthKey = (year: number, month: number) =>
	`${year}-${String(month).padStart(2, "0")}`;

const shiftMonth = (year: number, month: number, delta: number) => {
	const index = year * 12 + (month - 1) + delta;
	return { year: Math.floor(index / 12), month: (index % 12) + 1 };
};

export const summary = async (
	tc: TenantContext,
): Promise<DashboardSummaryResponse> => {
	const timezone = safeTimezone(tc.timezone);
	const organizationId = tc.organizationId;

	const current = zonedParts(new Date(), timezone);
	const oldest = shiftMonth(current.year, current.month, -(TREND_MONTHS - 1));
	const since = new Date(
		Date.UTC(oldest.year, oldest.month - 1, 1, 0, 0, 0) - 24 * 60 * 60 * 1000,
	);

	const [
		workOrdersByStatus,
		workOrdersByPriority,
		workOrdersByType,
		assetsByStatus,
		assetsByCriticality,
		totalParts,
		lowStockParts,
		created,
		completed,
	] = await Promise.all([
		repository.groupCount("work_orders", workOrders.status, organizationId),
		repository.groupCount("work_orders", workOrders.priority, organizationId),
		repository.groupCount("work_orders", workOrders.type, organizationId),
		repository.groupCount("assets", assets.status, organizationId),
		repository.groupCount("assets", assets.criticality, organizationId),
		repository.countRows("parts", organizationId),
		repository.countLowStockParts(organizationId),
		repository.monthlyCounts(organizationId, timezone, "created_at", since),
		repository.monthlyCounts(organizationId, timezone, "closed_at", since),
	]);

	const trend: TrendPoint[] = [];
	for (let offset = TREND_MONTHS - 1; offset >= 0; offset -= 1) {
		const point = shiftMonth(current.year, current.month, -offset);
		const key = monthKey(point.year, point.month);
		trend.push({
			month: key,
			created: created.get(key) ?? 0,
			completed: completed.get(key) ?? 0,
		});
	}

	const totalWorkOrders = workOrdersByStatus.reduce(
		(sum, row) => sum + row.count,
		0,
	);
	const openWorkOrders = workOrdersByStatus
		.filter((row) => row.key !== "completed" && row.key !== "cancelled")
		.reduce((sum, row) => sum + row.count, 0);

	const totalAssets = assetsByStatus.reduce((sum, row) => sum + row.count, 0);
	const assetsNeedingMaintenance =
		assetsByStatus.find((row) => row.key === "needs_maintenance")?.count ?? 0;

	return {
		kpis: {
			open_work_orders: openWorkOrders,
			total_work_orders: totalWorkOrders,
			low_stock_parts: lowStockParts,
			total_parts: totalParts,
			assets_needing_maintenance: assetsNeedingMaintenance,
			total_assets: totalAssets,
		},
		work_order_trend: trend,
		work_orders_by_status: workOrdersByStatus.map((row) => ({
			status: row.key,
			count: row.count,
		})),
		work_orders_by_priority: workOrdersByPriority.map((row) => ({
			priority: row.key,
			count: row.count,
		})),
		work_orders_by_type: workOrdersByType.map((row) => ({
			type: row.key,
			count: row.count,
		})),
		assets_by_status: assetsByStatus.map((row) => ({
			status: row.key,
			count: row.count,
		})),
		assets_by_criticality: assetsByCriticality.map((row) => ({
			criticality: row.key,
			count: row.count,
		})),
	};
};
