import {
	infiniteQueryOptions,
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import {
	createLocation,
	deleteLocation,
	getLocation,
	searchLocations,
	updateLocation,
} from "@/server/domains/locations/fn";
import type {
	LocationCreatePayload,
	LocationResponse,
	LocationSearchPayload,
	LocationUpdatePayload,
} from "@/server/domains/locations/schema";
import { isNotFound } from "./errors";
import { entityKeys } from "./keys";

export const locationsKeys = entityKeys("locations");

export const locationsQueryOptions = (
	orgId: string,
	params: LocationSearchPayload,
) =>
	queryOptions({
		queryKey: locationsKeys.list(orgId, params),
		queryFn: ({ signal }) =>
			searchLocations({ signal, data: { organization_id: orgId, ...params } }),
	});

export const locationsInfiniteQueryOptions = (
	orgId: string,
	params: Omit<LocationSearchPayload, "page">,
) =>
	infiniteQueryOptions({
		queryKey: locationsKeys.infinite(orgId, params),
		queryFn: ({ pageParam, signal }) =>
			searchLocations({
				signal,
				data: {
					organization_id: orgId,
					...params,
					page: pageParam,
					size: params.size ?? 20,
				},
			}),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			const totalPages = Math.ceil(lastPage.total / lastPage.size);
			return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
		},
		staleTime: 1000 * 60 * 5,
	});

export const locationQueryOptions = (orgId: string, locationId: number) =>
	queryOptions({
		queryKey: locationsKeys.detail(orgId, locationId),
		queryFn: ({ signal }) =>
			getLocation({
				signal,
				data: { organization_id: orgId, location_id: locationId },
			}),
		throwOnError: (error) => !isNotFound(error),
	});

export function useCreateLocationMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<LocationResponse, Error, LocationCreatePayload>({
		mutationFn: (data) =>
			createLocation({ data: { organization_id: orgId, ...data } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: locationsKeys.lists(orgId) });
			queryClient.invalidateQueries({
				queryKey: ["organization", orgId, "tags", "location"],
			});
		},
	});
}

export function useUpdateLocationMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<
		LocationResponse,
		Error,
		{ locationId: number; data: LocationUpdatePayload }
	>({
		mutationFn: ({ locationId, data }) =>
			updateLocation({
				data: { organization_id: orgId, location_id: locationId, data },
			}),
		onSuccess: (data, { locationId }) => {
			queryClient.setQueryData(locationsKeys.detail(orgId, locationId), data);
			queryClient.invalidateQueries({ queryKey: locationsKeys.lists(orgId) });
		},
	});
}

export function useDeleteLocationMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<void, Error, number>({
		mutationFn: (locationId) =>
			deleteLocation({
				data: { organization_id: orgId, location_id: locationId },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: locationsKeys.lists(orgId) });
		},
	});
}
