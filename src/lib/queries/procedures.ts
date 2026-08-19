import {
	infiniteQueryOptions,
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import * as m from "@/paraglide/messages";
import {
	createProcedure,
	deleteProcedure,
	getProcedure,
	searchProcedures,
	setProcedureTags,
	updateProcedure,
} from "@/server/domains/procedures/fn";
import type {
	ProcedureCreatePayload,
	ProcedureResponse,
	ProcedureSearchPayload,
	ProcedureUpdatePayload,
} from "@/server/domains/procedures/schema";
import { isNotFound, mapError } from "./errors";
import { entityKeys } from "./keys";

export const proceduresKeys = entityKeys("procedures");

export const proceduresQueryOptions = (
	orgId: string,
	params: ProcedureSearchPayload,
) =>
	queryOptions({
		queryKey: proceduresKeys.list(orgId, params),
		queryFn: ({ signal }) =>
			searchProcedures({ signal, data: { organization_id: orgId, ...params } }),
	});

export const proceduresInfiniteQueryOptions = (
	orgId: string,
	params: Omit<ProcedureSearchPayload, "page">,
) =>
	infiniteQueryOptions({
		queryKey: proceduresKeys.infinite(orgId, params),
		queryFn: ({ pageParam, signal }) =>
			searchProcedures({
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

export const procedureQueryOptions = (orgId: string, procedureId: number) =>
	queryOptions({
		queryKey: proceduresKeys.detail(orgId, procedureId),
		queryFn: ({ signal }) =>
			getProcedure({
				signal,
				data: { organization_id: orgId, procedure_id: procedureId },
			}),
		throwOnError: (error) => !isNotFound(error),
	});

export function useCreateProcedureMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<ProcedureResponse, Error, ProcedureCreatePayload>({
		mutationFn: (data) =>
			mapError("conflict", m.error_procedure_duplicate(), () =>
				createProcedure({ data: { organization_id: orgId, ...data } }),
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: proceduresKeys.lists(orgId) });
		},
	});
}

export function useUpdateProcedureMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<
		ProcedureResponse,
		Error,
		{ procedureId: number; data: ProcedureUpdatePayload }
	>({
		mutationFn: ({ procedureId, data }) =>
			mapError("conflict", m.error_procedure_duplicate(), () =>
				updateProcedure({
					data: { organization_id: orgId, procedure_id: procedureId, data },
				}),
			),
		onSuccess: (data, { procedureId }) => {
			queryClient.setQueryData(proceduresKeys.detail(orgId, procedureId), data);
			queryClient.invalidateQueries({ queryKey: proceduresKeys.lists(orgId) });
		},
	});
}

export function useSetProcedureTagsMutation(
	orgId: string,
	procedureId: number,
) {
	const queryClient = useQueryClient();
	return useMutation<void, Error, number[]>({
		mutationFn: (tagIds) =>
			setProcedureTags({
				data: {
					organization_id: orgId,
					procedure_id: procedureId,
					tag_ids: tagIds,
				},
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: proceduresKeys.all(orgId) });
		},
	});
}

export function useDeleteProcedureMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<void, Error, number>({
		mutationFn: (procedureId) =>
			deleteProcedure({
				data: { organization_id: orgId, procedure_id: procedureId },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: proceduresKeys.lists(orgId) });
		},
	});
}
