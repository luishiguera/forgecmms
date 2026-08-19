import {
	infiniteQueryOptions,
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import * as m from "@/paraglide/messages";
import {
	createAsset,
	deleteAsset,
	getAsset,
	searchAssets,
	updateAsset,
} from "@/server/domains/assets/fn";
import type {
	AssetCreatePayload,
	AssetResponse,
	AssetSearchPayload,
	AssetUpdatePayload,
} from "@/server/domains/assets/schema";
import { isNotFound, mapError } from "./errors";
import { entityKeys } from "./keys";

export const assetsKeys = entityKeys("assets");

export const assetsQueryOptions = (orgId: string, params: AssetSearchPayload) =>
	queryOptions({
		queryKey: assetsKeys.list(orgId, params),
		queryFn: ({ signal }) =>
			searchAssets({ signal, data: { organization_id: orgId, ...params } }),
	});

export const assetsInfiniteQueryOptions = (
	orgId: string,
	params: Omit<AssetSearchPayload, "page">,
) =>
	infiniteQueryOptions({
		queryKey: assetsKeys.infinite(orgId, params),
		queryFn: ({ pageParam, signal }) =>
			searchAssets({
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

export const assetQueryOptions = (orgId: string, assetId: number) =>
	queryOptions({
		queryKey: assetsKeys.detail(orgId, assetId),
		queryFn: ({ signal }) =>
			getAsset({ signal, data: { organization_id: orgId, asset_id: assetId } }),
		throwOnError: (error) => !isNotFound(error),
	});

export function useCreateAssetMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<AssetResponse, Error, AssetCreatePayload>({
		mutationFn: (data) =>
			mapError("conflict", m.error_asset_duplicate(), () =>
				createAsset({ data: { organization_id: orgId, ...data } }),
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: assetsKeys.lists(orgId) });
			queryClient.invalidateQueries({
				queryKey: ["organization", orgId, "tags", "asset"],
			});
		},
	});
}

export function useUpdateAssetMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<
		AssetResponse,
		Error,
		{ assetId: number; data: AssetUpdatePayload }
	>({
		mutationFn: ({ assetId, data }) =>
			mapError("conflict", m.error_asset_duplicate(), () =>
				updateAsset({
					data: { organization_id: orgId, asset_id: assetId, data },
				}),
			),
		onSuccess: (data, { assetId }) => {
			queryClient.setQueryData(assetsKeys.detail(orgId, assetId), data);
			queryClient.invalidateQueries({ queryKey: assetsKeys.lists(orgId) });
		},
	});
}

export function useDeleteAssetMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<void, Error, number>({
		mutationFn: (assetId) =>
			deleteAsset({ data: { organization_id: orgId, asset_id: assetId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: assetsKeys.lists(orgId) });
		},
	});
}
