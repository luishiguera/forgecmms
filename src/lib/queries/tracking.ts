import { queryOptions } from "@tanstack/react-query";
import { searchTracks } from "@/server/domains/tracking/fn";
import type { TrackSearchPayload } from "@/server/domains/tracking/schema";

export const tracksQueryOptions = (
	orgId: string,
	params?: TrackSearchPayload,
) =>
	queryOptions({
		queryKey: ["organization", orgId, "tracking", "tracks", params],
		queryFn: ({ signal }) =>
			searchTracks({
				signal,
				data: { organization_id: orgId, ...params },
			}),
		refetchInterval: 30000,
	});
