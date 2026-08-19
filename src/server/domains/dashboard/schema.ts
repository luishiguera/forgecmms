import type { AssetCriticality, AssetStatus } from "../assets/schema";
import type {
	WorkOrderPriority,
	WorkOrderStatus,
	WorkOrderType,
} from "../workorders/schema";

export type DashboardKpis = {
	open_work_orders: number;
	total_work_orders: number;
	low_stock_parts: number;
	total_parts: number;
	assets_needing_maintenance: number;
	total_assets: number;
};

export type TrendPoint = {
	month: string;
	created: number;
	completed: number;
};

export type WorkOrderStatusCount = { status: WorkOrderStatus; count: number };
export type WorkOrderPriorityCount = {
	priority: WorkOrderPriority;
	count: number;
};
export type WorkOrderTypeCount = { type: WorkOrderType; count: number };
export type AssetStatusCount = { status: AssetStatus; count: number };
export type AssetCriticalityCount = {
	criticality: AssetCriticality;
	count: number;
};

export type DashboardSummaryResponse = {
	kpis: DashboardKpis;
	work_order_trend: TrendPoint[];
	work_orders_by_status: WorkOrderStatusCount[];
	work_orders_by_priority: WorkOrderPriorityCount[];
	work_orders_by_type: WorkOrderTypeCount[];
	assets_by_status: AssetStatusCount[];
	assets_by_criticality: AssetCriticalityCount[];
};
