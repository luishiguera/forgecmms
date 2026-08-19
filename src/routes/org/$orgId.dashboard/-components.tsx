import type { Icon } from "@phosphor-icons/react";
import { ClipboardTextIcon } from "@phosphor-icons/react/dist/csr/ClipboardText";
import { HardDriveIcon } from "@phosphor-icons/react/dist/csr/HardDrive";
import { PackageIcon } from "@phosphor-icons/react/dist/csr/Package";
import { ShieldWarningIcon } from "@phosphor-icons/react/dist/csr/ShieldWarning";
import { StackIcon } from "@phosphor-icons/react/dist/csr/Stack";
import { TrendUpIcon } from "@phosphor-icons/react/dist/csr/TrendUp";
import { WrenchIcon } from "@phosphor-icons/react/dist/csr/Wrench";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	XAxis,
	YAxis,
} from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import {
	getPriorityLabel,
	getTypeLabel,
	type WorkOrderPriority,
	type WorkOrderType,
} from "@/lib/work-orders/labels";
import * as m from "@/paraglide/messages";
import type {
	AssetCriticality,
	AssetStatus,
} from "@/server/domains/assets/schema";
import type {
	DashboardKpis,
	DashboardSummaryResponse,
} from "@/server/domains/dashboard/schema";
import { formatDate } from "@/utils/format-date";
import {
	getStatusOptions as getAssetStatusOptions,
	getCriticalityOptions,
} from "../$orgId.assets/-types";
import {
	getStatusLabel,
	type WorkOrderStatus,
} from "../$orgId.work-orders/-types";

type BreakdownDatum = {
	key: string;
	label: string;
	value: number;
	fill: string;
};

const WO_STATUS_COLOR: Record<WorkOrderStatus, string> = {
	pending: "var(--color-slate-400)",
	reviewing: "var(--color-amber-500)",
	planned: "var(--color-sky-500)",
	in_progress: "var(--color-violet-500)",
	completed: "var(--color-emerald-500)",
	cancelled: "var(--color-red-500)",
};

const WO_PRIORITY_COLOR: Record<WorkOrderPriority, string> = {
	low: "var(--color-slate-500)",
	medium: "var(--color-sky-500)",
	high: "var(--color-amber-500)",
	urgent: "var(--color-red-500)",
};

const WO_TYPE_COLOR: Record<WorkOrderType, string> = {
	preventive: "var(--color-emerald-500)",
	reactive: "var(--color-amber-500)",
	other: "var(--color-slate-400)",
};

const ASSET_STATUS_COLOR: Record<AssetStatus, string> = {
	operational: "var(--color-emerald-500)",
	needs_maintenance: "var(--color-amber-500)",
	pending: "var(--color-sky-500)",
	retired: "var(--color-slate-400)",
};

const ASSET_CRITICALITY_COLOR: Record<AssetCriticality, string> = {
	critical: "var(--color-red-500)",
	important: "var(--color-amber-500)",
	normal: "var(--color-slate-400)",
};

function assetStatusLabel(status: AssetStatus): string {
	return (
		getAssetStatusOptions().find((o) => o.value === status)?.label ?? status
	);
}

function assetCriticalityLabel(criticality: AssetCriticality): string {
	return (
		getCriticalityOptions().find((o) => o.value === criticality)?.label ??
		criticality
	);
}

function buildConfig(data: BreakdownDatum[]): ChartConfig {
	return Object.fromEntries(
		data.map((d) => [d.key, { label: d.label, color: d.fill }]),
	);
}

export function KpiCard({
	label,
	value,
	hint,
	icon: IconCmp,
}: {
	label: string;
	value: number;
	hint: string;
	icon: Icon;
}) {
	return (
		<Card>
			<CardContent className="flex items-start justify-between gap-3">
				<div className="space-y-1">
					<p className="text-xs font-medium text-muted-foreground">{label}</p>
					<p className="text-2xl font-semibold tracking-tight tabular-nums">
						{value.toLocaleString()}
					</p>
					<p className="text-xs text-muted-foreground">{hint}</p>
				</div>
				<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
					<IconCmp className="size-5" weight="duotone" />
				</div>
			</CardContent>
		</Card>
	);
}

export function DashboardKpiRow({ kpis }: { kpis: DashboardKpis }) {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<KpiCard
				label={m.dashboard_kpi_open_work_orders()}
				value={kpis.open_work_orders}
				hint={m.dashboard_kpi_open_work_orders_hint({
					count: kpis.total_work_orders,
				})}
				icon={ClipboardTextIcon}
			/>
			<KpiCard
				label={m.dashboard_kpi_low_stock_parts()}
				value={kpis.low_stock_parts}
				hint={m.dashboard_kpi_low_stock_parts_hint({
					count: kpis.total_parts,
				})}
				icon={PackageIcon}
			/>
			<KpiCard
				label={m.dashboard_kpi_assets_maintenance()}
				value={kpis.assets_needing_maintenance}
				hint={m.dashboard_kpi_assets_maintenance_hint({
					count: kpis.total_assets,
				})}
				icon={WrenchIcon}
			/>
		</div>
	);
}

export function WorkOrderTrendCard({
	data,
}: {
	data: DashboardSummaryResponse["work_order_trend"];
}) {
	const trendConfig = {
		created: {
			label: m.dashboard_trend_created(),
			color: "var(--color-sky-500)",
		},
		completed: {
			label: m.dashboard_trend_completed(),
			color: "var(--color-emerald-500)",
		},
	} satisfies ChartConfig;
	const chartData = data.map((point) => {
		const [year, month] = point.month.split("-").map(Number);
		return {
			month: formatDate(new Date(year, month - 1, 1), { style: "month" }),
			created: point.created,
			completed: point.completed,
		};
	});
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TrendUpIcon
						className="size-4 text-muted-foreground"
						weight="duotone"
					/>
					{m.wo_title()}
				</CardTitle>
				<CardDescription>{m.dashboard_trend_description()}</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={trendConfig} className="h-[260px] w-full">
					<AreaChart
						data={chartData}
						margin={{ left: 4, right: 12, top: 8, bottom: 0 }}
					>
						<defs>
							<linearGradient id="fillCreated" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stopColor="var(--color-created)"
									stopOpacity={0.3}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-created)"
									stopOpacity={0.02}
								/>
							</linearGradient>
							<linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stopColor="var(--color-completed)"
									stopOpacity={0.3}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-completed)"
									stopOpacity={0.02}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="line" />}
						/>
						<Area
							dataKey="completed"
							type="natural"
							fill="url(#fillCompleted)"
							stroke="var(--color-completed)"
							strokeWidth={2}
						/>
						<Area
							dataKey="created"
							type="natural"
							fill="url(#fillCreated)"
							stroke="var(--color-created)"
							strokeWidth={2}
						/>
						<ChartLegend content={<ChartLegendContent />} />
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

function BarBreakdownCard({
	title,
	description,
	icon: IconCmp,
	data,
}: {
	title: string;
	description: string;
	icon: Icon;
	data: BreakdownDatum[];
}) {
	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<IconCmp className="size-4 text-muted-foreground" weight="duotone" />
					{title}
				</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer
					config={buildConfig(data)}
					className="w-full"
					style={{ height: data.length * 40 + 16 }}
				>
					<BarChart
						data={data}
						layout="vertical"
						margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
					>
						<CartesianGrid horizontal={false} />
						<XAxis type="number" hide />
						<YAxis
							type="category"
							dataKey="label"
							tickLine={false}
							axisLine={false}
							width={104}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent nameKey="key" hideLabel />}
						/>
						<Bar dataKey="value" radius={4}>
							{data.map((d) => (
								<Cell key={d.key} fill={d.fill} />
							))}
						</Bar>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

function DonutCard({
	title,
	description,
	icon: IconCmp,
	data,
}: {
	title: string;
	description: string;
	icon: Icon;
	data: BreakdownDatum[];
}) {
	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<IconCmp className="size-4 text-muted-foreground" weight="duotone" />
					{title}
				</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer
					config={buildConfig(data)}
					className="mx-auto aspect-square max-h-[240px]"
				>
					<PieChart>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent nameKey="key" hideLabel />}
						/>
						<Pie
							data={data}
							dataKey="value"
							nameKey="key"
							innerRadius={56}
							outerRadius={88}
							paddingAngle={2}
						>
							{data.map((d) => (
								<Cell key={d.key} fill={d.fill} stroke="var(--color-card)" />
							))}
						</Pie>
						<ChartLegend
							content={<ChartLegendContent nameKey="key" />}
							className="flex-wrap"
						/>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

export function WorkOrdersByStatusCard({
	data,
}: {
	data: DashboardSummaryResponse["work_orders_by_status"];
}) {
	const breakdown: BreakdownDatum[] = data.map((d) => ({
		key: d.status,
		label: getStatusLabel(d.status),
		value: d.count,
		fill: WO_STATUS_COLOR[d.status],
	}));
	return (
		<BarBreakdownCard
			title={m.dashboard_by_status()}
			description={m.wo_title()}
			icon={ClipboardTextIcon}
			data={breakdown}
		/>
	);
}

export function WorkOrdersByPriorityCard({
	data,
}: {
	data: DashboardSummaryResponse["work_orders_by_priority"];
}) {
	const breakdown: BreakdownDatum[] = data.map((d) => ({
		key: d.priority,
		label: getPriorityLabel(d.priority),
		value: d.count,
		fill: WO_PRIORITY_COLOR[d.priority],
	}));
	return (
		<BarBreakdownCard
			title={m.dashboard_by_priority()}
			description={m.wo_title()}
			icon={ShieldWarningIcon}
			data={breakdown}
		/>
	);
}

export function WorkOrdersByTypeCard({
	data,
}: {
	data: DashboardSummaryResponse["work_orders_by_type"];
}) {
	const breakdown: BreakdownDatum[] = data.map((d) => ({
		key: d.type,
		label: getTypeLabel(d.type),
		value: d.count,
		fill: WO_TYPE_COLOR[d.type],
	}));
	return (
		<DonutCard
			title={m.dashboard_by_type()}
			description={m.dashboard_by_type_description()}
			icon={WrenchIcon}
			data={breakdown}
		/>
	);
}

export function AssetsByStatusCard({
	data,
}: {
	data: DashboardSummaryResponse["assets_by_status"];
}) {
	const breakdown: BreakdownDatum[] = data.map((d) => ({
		key: d.status,
		label: assetStatusLabel(d.status),
		value: d.count,
		fill: ASSET_STATUS_COLOR[d.status],
	}));
	return (
		<DonutCard
			title={m.dashboard_assets_status()}
			description={m.dashboard_assets_status_description()}
			icon={HardDriveIcon}
			data={breakdown}
		/>
	);
}

export function AssetsByCriticalityCard({
	data,
}: {
	data: DashboardSummaryResponse["assets_by_criticality"];
}) {
	const breakdown: BreakdownDatum[] = data.map((d) => ({
		key: d.criticality,
		label: assetCriticalityLabel(d.criticality),
		value: d.count,
		fill: ASSET_CRITICALITY_COLOR[d.criticality],
	}));
	return (
		<BarBreakdownCard
			title={m.dashboard_assets_criticality()}
			description={m.dashboard_assets_criticality_description()}
			icon={StackIcon}
			data={breakdown}
		/>
	);
}
