import { CalendarBlankIcon } from "@phosphor-icons/react/dist/csr/CalendarBlank";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Spinner } from "@/components/ui/spinner";
import { dashboardSummaryQueryOptions } from "@/lib/queries/dashboard";
import * as m from "@/paraglide/messages";
import {
	AssetsByCriticalityCard,
	AssetsByStatusCard,
	DashboardKpiRow,
	WorkOrdersByPriorityCard,
	WorkOrdersByStatusCard,
	WorkOrdersByTypeCard,
	WorkOrderTrendCard,
} from "./$orgId.dashboard/-components";

export const Route = createFileRoute("/org/$orgId/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { orgId } = Route.useParams();
	const { data, isPending, isError } = useQuery(
		dashboardSummaryQueryOptions(orgId),
	);

	return (
		<div className="flex h-full min-h-0 flex-col">
			<header className="shrink-0 border-b bg-background px-4 py-4 lg:px-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-lg font-semibold tracking-tight">
							{m.dashboard_title()}
						</h1>
						<p className="text-xs text-muted-foreground">
							{m.dashboard_subtitle()}
						</p>
					</div>
					<div className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
						<CalendarBlankIcon className="size-4" weight="duotone" />
						{m.dashboard_range()}
					</div>
				</div>
			</header>

			<div className="flex-1 min-h-0 space-y-6 overflow-y-auto bg-muted/30 px-4 py-6 lg:px-6">
				{isPending ? (
					<div className="flex h-full items-center justify-center">
						<Spinner className="size-8 text-primary" />
					</div>
				) : isError || !data ? (
					<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
						{m.dashboard_load_error()}
					</div>
				) : (
					<>
						<DashboardKpiRow kpis={data.kpis} />

						<WorkOrderTrendCard data={data.work_order_trend} />

						<div className="grid gap-4 lg:grid-cols-3">
							<WorkOrdersByStatusCard data={data.work_orders_by_status} />
							<WorkOrdersByPriorityCard data={data.work_orders_by_priority} />
							<WorkOrdersByTypeCard data={data.work_orders_by_type} />
						</div>

						<div className="grid gap-4 lg:grid-cols-2">
							<AssetsByStatusCard data={data.assets_by_status} />
							<AssetsByCriticalityCard data={data.assets_by_criticality} />
						</div>
					</>
				)}
			</div>
		</div>
	);
}
