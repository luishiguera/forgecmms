import { queryOptions } from "@tanstack/react-query";
import { getDashboardSummary } from "@/server/domains/dashboard/fn";

export const dashboardSummaryQueryOptions = (orgId: string) =>
	queryOptions({
		queryKey: ["organization", orgId, "dashboard"],
		queryFn: ({ signal }) =>
			getDashboardSummary({ signal, data: { organization_id: orgId } }),
	});
