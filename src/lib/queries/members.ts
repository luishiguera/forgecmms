import { queryOptions } from "@tanstack/react-query";
import { searchMembers } from "@/server/domains/organizations/fn";
import type { MemberSearchPayload } from "@/server/domains/organizations/schema";

export const membersQueryOptions = (
	orgId: string,
	params?: MemberSearchPayload,
) =>
	queryOptions({
		queryKey: ["organization", orgId, "members", params],
		queryFn: ({ signal }) =>
			searchMembers({ signal, data: { organization_id: orgId, ...params } }),
	});
