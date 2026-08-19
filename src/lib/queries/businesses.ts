import {
	infiniteQueryOptions,
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import {
	createBusiness,
	deleteBusiness,
	getBusiness,
	searchBusinesses,
	updateBusiness,
} from "@/server/domains/businesses/fn";
import type {
	BusinessCreatePayload,
	BusinessResponse,
	BusinessSearchPayload,
	BusinessUpdatePayload,
} from "@/server/domains/businesses/schema";
import { isNotFound } from "./errors";
import { entityKeys } from "./keys";
import { locationsKeys } from "./locations";

export const businessesKeys = entityKeys("businesses");

export const businessesQueryOptions = (
	orgId: string,
	params: BusinessSearchPayload,
) =>
	queryOptions({
		queryKey: businessesKeys.list(orgId, params),
		queryFn: ({ signal }) =>
			searchBusinesses({ signal, data: { organization_id: orgId, ...params } }),
	});

export const businessesInfiniteQueryOptions = (
	orgId: string,
	params: Omit<BusinessSearchPayload, "page">,
) =>
	infiniteQueryOptions({
		queryKey: businessesKeys.infinite(orgId, params),
		queryFn: ({ pageParam, signal }) =>
			searchBusinesses({
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

export const businessQueryOptions = (orgId: string, businessId: number) =>
	queryOptions({
		queryKey: businessesKeys.detail(orgId, businessId),
		queryFn: ({ signal }) =>
			getBusiness({
				signal,
				data: { organization_id: orgId, business_id: businessId },
			}),
		throwOnError: (error) => !isNotFound(error),
	});

export function useCreateBusinessMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<BusinessResponse, Error, BusinessCreatePayload>({
		mutationFn: (data) =>
			createBusiness({ data: { organization_id: orgId, ...data } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: businessesKeys.lists(orgId) });
		},
	});
}

export function useUpdateBusinessMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<
		BusinessResponse,
		Error,
		{ businessId: number; data: BusinessUpdatePayload }
	>({
		mutationFn: ({ businessId, data }) =>
			updateBusiness({
				data: { organization_id: orgId, business_id: businessId, data },
			}),
		onSuccess: (data, { businessId }) => {
			queryClient.setQueryData(businessesKeys.detail(orgId, businessId), data);
			queryClient.invalidateQueries({ queryKey: businessesKeys.lists(orgId) });
			queryClient.invalidateQueries({ queryKey: locationsKeys.all(orgId) });
		},
	});
}

export function useDeleteBusinessMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<void, Error, number>({
		mutationFn: (businessId) =>
			deleteBusiness({
				data: { organization_id: orgId, business_id: businessId },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: businessesKeys.lists(orgId) });
			queryClient.invalidateQueries({ queryKey: locationsKeys.all(orgId) });
		},
	});
}
