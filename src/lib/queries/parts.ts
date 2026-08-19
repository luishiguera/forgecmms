import {
	infiniteQueryOptions,
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import * as m from "@/paraglide/messages";
import {
	createPart,
	deletePart,
	getPart,
	searchParts,
	updatePart,
} from "@/server/domains/parts/fn";
import type {
	PartCreatePayload,
	PartResponse,
	PartSearchPayload,
	PartUpdatePayload,
} from "@/server/domains/parts/schema";
import { isNotFound, mapError } from "./errors";
import { entityKeys } from "./keys";

export const partsKeys = entityKeys("parts");

export const partsQueryOptions = (orgId: string, params: PartSearchPayload) =>
	queryOptions({
		queryKey: partsKeys.list(orgId, params),
		queryFn: ({ signal }) =>
			searchParts({ signal, data: { organization_id: orgId, ...params } }),
	});

export const partsInfiniteQueryOptions = (
	orgId: string,
	params: Omit<PartSearchPayload, "page">,
) =>
	infiniteQueryOptions({
		queryKey: partsKeys.infinite(orgId, params),
		queryFn: ({ pageParam, signal }) =>
			searchParts({
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

export const partQueryOptions = (orgId: string, partId: number) =>
	queryOptions({
		queryKey: partsKeys.detail(orgId, partId),
		queryFn: ({ signal }) =>
			getPart({ signal, data: { organization_id: orgId, part_id: partId } }),
		throwOnError: (error) => !isNotFound(error),
	});

export function useCreatePartMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<PartResponse, Error, PartCreatePayload>({
		mutationFn: (data) =>
			mapError("conflict", m.error_part_duplicate(), () =>
				createPart({ data: { organization_id: orgId, ...data } }),
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: partsKeys.lists(orgId) });
			queryClient.invalidateQueries({
				queryKey: ["organization", orgId, "tags", "part"],
			});
		},
	});
}

export function useUpdatePartMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<
		PartResponse,
		Error,
		{ partId: number; data: PartUpdatePayload }
	>({
		mutationFn: ({ partId, data }) =>
			mapError("conflict", m.error_part_duplicate(), () =>
				updatePart({ data: { organization_id: orgId, part_id: partId, data } }),
			),
		onSuccess: (data, { partId }) => {
			queryClient.setQueryData(partsKeys.detail(orgId, partId), data);
			queryClient.invalidateQueries({ queryKey: partsKeys.lists(orgId) });
		},
	});
}

export function useDeletePartMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<void, Error, number>({
		mutationFn: (partId) =>
			deletePart({ data: { organization_id: orgId, part_id: partId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: partsKeys.lists(orgId) });
		},
	});
}
