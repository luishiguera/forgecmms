import {
	infiniteQueryOptions,
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import {
	addWorkOrderAsset,
	addWorkOrderAssetProcedure,
	addWorkOrderAssignee,
	addWorkOrderPart,
	addWorkOrderProcedure,
	createWorkOrder,
	deleteWorkOrder,
	getWorkOrder,
	removeWorkOrderAsset,
	removeWorkOrderAssetProcedure,
	removeWorkOrderAssignee,
	removeWorkOrderPart,
	removeWorkOrderProcedure,
	searchWorkOrders,
	updateWorkOrder,
	updateWorkOrderAssetProcedure,
	updateWorkOrderPart,
	updateWorkOrderProcedure,
} from "@/server/domains/workorders/fn";
import type {
	ProcedureResponses,
	WorkOrderCreatePayload,
	WorkOrderResponse,
	WorkOrderSearchPayload,
	WorkOrderUpdatePayload,
} from "@/server/domains/workorders/schema";
import { isNotFound } from "./errors";
import { entityKeys } from "./keys";
import { partsKeys } from "./parts";

export const workOrdersKeys = entityKeys("work-orders");

export const workOrdersQueryOptions = (
	orgId: string,
	params: WorkOrderSearchPayload,
) =>
	queryOptions({
		queryKey: workOrdersKeys.list(orgId, params),
		queryFn: ({ signal }) =>
			searchWorkOrders({ signal, data: { organization_id: orgId, ...params } }),
	});

export const workOrdersInfiniteQueryOptions = (
	orgId: string,
	params: Omit<WorkOrderSearchPayload, "page">,
) =>
	infiniteQueryOptions({
		queryKey: workOrdersKeys.infinite(orgId, params),
		queryFn: ({ pageParam, signal }) =>
			searchWorkOrders({
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

export const workOrderQueryOptions = (orgId: string, workOrderId: number) =>
	queryOptions({
		queryKey: workOrdersKeys.detail(orgId, workOrderId),
		queryFn: ({ signal }) =>
			getWorkOrder({
				signal,
				data: { organization_id: orgId, work_order_id: workOrderId },
			}),
		throwOnError: (error) => !isNotFound(error),
	});

export function useCreateWorkOrderMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<WorkOrderResponse, Error, WorkOrderCreatePayload>({
		mutationFn: (data) =>
			createWorkOrder({ data: { organization_id: orgId, ...data } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: workOrdersKeys.lists(orgId) });
			queryClient.invalidateQueries({
				queryKey: ["organization", orgId, "tags", "work_order"],
			});
		},
	});
}

export function useUpdateWorkOrderMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<
		WorkOrderResponse,
		Error,
		{ workOrderId: number; data: WorkOrderUpdatePayload }
	>({
		mutationFn: ({ workOrderId, data }) =>
			updateWorkOrder({
				data: { organization_id: orgId, work_order_id: workOrderId, data },
			}),
		onSuccess: (data, { workOrderId }) => {
			queryClient.setQueryData(workOrdersKeys.detail(orgId, workOrderId), data);
			queryClient.invalidateQueries({ queryKey: workOrdersKeys.lists(orgId) });
		},
	});
}

export function useDeleteWorkOrderMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<void, Error, number>({
		mutationFn: async (workOrderId) => {
			await deleteWorkOrder({
				data: { organization_id: orgId, work_order_id: workOrderId },
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: workOrdersKeys.lists(orgId) });
		},
	});
}

function useWorkOrderDetailSync(orgId: string, workOrderId: number) {
	const queryClient = useQueryClient();
	return (data: WorkOrderResponse) => {
		queryClient.setQueryData(workOrdersKeys.detail(orgId, workOrderId), data);
	};
}

function useWorkOrderPartsSync(orgId: string, workOrderId: number) {
	const queryClient = useQueryClient();
	return (data: WorkOrderResponse) => {
		queryClient.setQueryData(workOrdersKeys.detail(orgId, workOrderId), data);
		queryClient.invalidateQueries({ queryKey: partsKeys.all(orgId) });
	};
}

export function useCreateWorkOrderPartMutation(
	orgId: string,
	workOrderId: number,
) {
	const syncDetail = useWorkOrderPartsSync(orgId, workOrderId);
	return useMutation<
		WorkOrderResponse,
		Error,
		{ partId: number; plannedQuantity: number }
	>({
		mutationFn: ({ partId, plannedQuantity }) =>
			addWorkOrderPart({
				data: {
					organization_id: orgId,
					work_order_id: workOrderId,
					part_id: partId,
					planned_quantity: plannedQuantity,
				},
			}),
		onSuccess: syncDetail,
	});
}

export function useUpdateWorkOrderPartMutation(
	orgId: string,
	workOrderId: number,
) {
	const syncDetail = useWorkOrderPartsSync(orgId, workOrderId);
	return useMutation<
		WorkOrderResponse,
		Error,
		{ partId: number; plannedQuantity: number; usedQuantity: number }
	>({
		mutationFn: ({ partId, plannedQuantity, usedQuantity }) =>
			updateWorkOrderPart({
				data: {
					organization_id: orgId,
					work_order_id: workOrderId,
					part_id: partId,
					planned_quantity: plannedQuantity,
					used_quantity: usedQuantity,
				},
			}),
		onSuccess: syncDetail,
	});
}

export function useDeleteWorkOrderPartMutation(
	orgId: string,
	workOrderId: number,
) {
	const syncDetail = useWorkOrderPartsSync(orgId, workOrderId);
	return useMutation<WorkOrderResponse, Error, number>({
		mutationFn: (partId) =>
			removeWorkOrderPart({
				data: {
					organization_id: orgId,
					work_order_id: workOrderId,
					part_id: partId,
				},
			}),
		onSuccess: syncDetail,
	});
}

export function useCreateWorkOrderAssetMutation(
	orgId: string,
	workOrderId: number,
) {
	const syncDetail = useWorkOrderDetailSync(orgId, workOrderId);
	return useMutation<WorkOrderResponse, Error, number>({
		mutationFn: (assetId) =>
			addWorkOrderAsset({
				data: {
					organization_id: orgId,
					work_order_id: workOrderId,
					asset_id: assetId,
				},
			}),
		onSuccess: syncDetail,
	});
}

export function useDeleteWorkOrderAssetMutation(
	orgId: string,
	workOrderId: number,
) {
	const syncDetail = useWorkOrderDetailSync(orgId, workOrderId);
	return useMutation<WorkOrderResponse, Error, number>({
		mutationFn: (assetId) =>
			removeWorkOrderAsset({
				data: {
					organization_id: orgId,
					work_order_id: workOrderId,
					asset_id: assetId,
				},
			}),
		onSuccess: syncDetail,
	});
}

export function useCreateWorkOrderAssigneeMutation(
	orgId: string,
	workOrderId: number,
) {
	const syncDetail = useWorkOrderDetailSync(orgId, workOrderId);
	return useMutation<WorkOrderResponse, Error, number>({
		mutationFn: (userId) =>
			addWorkOrderAssignee({
				data: {
					organization_id: orgId,
					work_order_id: workOrderId,
					user_id: userId,
				},
			}),
		onSuccess: syncDetail,
	});
}

export function useDeleteWorkOrderAssigneeMutation(
	orgId: string,
	workOrderId: number,
) {
	const syncDetail = useWorkOrderDetailSync(orgId, workOrderId);
	return useMutation<WorkOrderResponse, Error, number>({
		mutationFn: (userId) =>
			removeWorkOrderAssignee({
				data: {
					organization_id: orgId,
					work_order_id: workOrderId,
					user_id: userId,
				},
			}),
		onSuccess: syncDetail,
	});
}

export function useCreateWorkOrderProcedureMutation(
	orgId: string,
	workOrderId: number,
) {
	const syncDetail = useWorkOrderDetailSync(orgId, workOrderId);
	return useMutation<WorkOrderResponse, Error, number>({
		mutationFn: (procedureId) =>
			addWorkOrderProcedure({
				data: {
					organization_id: orgId,
					work_order_id: workOrderId,
					procedure_id: procedureId,
				},
			}),
		onSuccess: syncDetail,
	});
}

export function useUpdateWorkOrderProcedureMutation(
	orgId: string,
	workOrderId: number,
) {
	const syncDetail = useWorkOrderDetailSync(orgId, workOrderId);
	return useMutation<
		WorkOrderResponse,
		Error,
		{ procedureId: number; procedureResponses: ProcedureResponses }
	>({
		mutationFn: ({ procedureId, procedureResponses }) =>
			updateWorkOrderProcedure({
				data: {
					organization_id: orgId,
					work_order_id: workOrderId,
					procedure_id: procedureId,
					procedure_responses: procedureResponses,
				},
			}),
		onSuccess: syncDetail,
	});
}

export function useDeleteWorkOrderProcedureMutation(
	orgId: string,
	workOrderId: number,
) {
	const syncDetail = useWorkOrderDetailSync(orgId, workOrderId);
	return useMutation<WorkOrderResponse, Error, number>({
		mutationFn: (procedureId) =>
			removeWorkOrderProcedure({
				data: {
					organization_id: orgId,
					work_order_id: workOrderId,
					procedure_id: procedureId,
				},
			}),
		onSuccess: syncDetail,
	});
}

export function useCreateWorkOrderAssetProcedureMutation(
	orgId: string,
	workOrderId: number,
) {
	const syncDetail = useWorkOrderDetailSync(orgId, workOrderId);
	return useMutation<
		WorkOrderResponse,
		Error,
		{ assetId: number; procedureId: number }
	>({
		mutationFn: ({ assetId, procedureId }) =>
			addWorkOrderAssetProcedure({
				data: {
					organization_id: orgId,
					work_order_id: workOrderId,
					asset_id: assetId,
					procedure_id: procedureId,
				},
			}),
		onSuccess: syncDetail,
	});
}

export function useUpdateWorkOrderAssetProcedureMutation(
	orgId: string,
	workOrderId: number,
) {
	const syncDetail = useWorkOrderDetailSync(orgId, workOrderId);
	return useMutation<
		WorkOrderResponse,
		Error,
		{
			assetId: number;
			procedureId: number;
			procedureResponses: ProcedureResponses;
		}
	>({
		mutationFn: ({ assetId, procedureId, procedureResponses }) =>
			updateWorkOrderAssetProcedure({
				data: {
					organization_id: orgId,
					work_order_id: workOrderId,
					asset_id: assetId,
					procedure_id: procedureId,
					procedure_responses: procedureResponses,
				},
			}),
		onSuccess: syncDetail,
	});
}

export function useDeleteWorkOrderAssetProcedureMutation(
	orgId: string,
	workOrderId: number,
) {
	const syncDetail = useWorkOrderDetailSync(orgId, workOrderId);
	return useMutation<
		WorkOrderResponse,
		Error,
		{ assetId: number; procedureId: number }
	>({
		mutationFn: ({ assetId, procedureId }) =>
			removeWorkOrderAssetProcedure({
				data: {
					organization_id: orgId,
					work_order_id: workOrderId,
					asset_id: assetId,
					procedure_id: procedureId,
				},
			}),
		onSuccess: syncDetail,
	});
}

export function useAssignWorkOrderMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<
		void,
		Error,
		{
			workOrderId: number;
			userId: number;
			plannedStart: string;
			plannedEnd: string;
		}
	>({
		mutationFn: async ({ workOrderId, userId, plannedStart, plannedEnd }) => {
			await addWorkOrderAssignee({
				data: {
					organization_id: orgId,
					work_order_id: workOrderId,
					user_id: userId,
				},
			});
			await updateWorkOrder({
				data: {
					organization_id: orgId,
					work_order_id: workOrderId,
					data: {
						planned_start: plannedStart,
						planned_end: plannedEnd,
						status: "planned",
					},
				},
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: workOrdersKeys.all(orgId) });
		},
	});
}
