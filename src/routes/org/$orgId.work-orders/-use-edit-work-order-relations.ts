import { type FieldStatus, getMutationStatus } from "@/hooks/use-auto-save";
import {
	useCreateWorkOrderAssetMutation,
	useCreateWorkOrderAssetProcedureMutation,
	useCreateWorkOrderAssigneeMutation,
	useCreateWorkOrderPartMutation,
	useCreateWorkOrderProcedureMutation,
	useDeleteWorkOrderAssetMutation,
	useDeleteWorkOrderAssetProcedureMutation,
	useDeleteWorkOrderAssigneeMutation,
	useDeleteWorkOrderPartMutation,
	useDeleteWorkOrderProcedureMutation,
	useUpdateWorkOrderPartMutation,
} from "@/lib/queries/work-orders";
import type { WorkOrderResponse } from "@/server/domains/workorders/schema";
import type { WorkOrderRelations } from "./-work-order-relations-context";

export function useEditWorkOrderRelations({
	orgId,
	workOrderId,
	workOrder,
}: {
	orgId: string;
	workOrderId: number;
	workOrder: WorkOrderResponse;
}): WorkOrderRelations {
	const createPartMutation = useCreateWorkOrderPartMutation(orgId, workOrderId);
	const updatePartMutation = useUpdateWorkOrderPartMutation(orgId, workOrderId);
	const deletePartMutation = useDeleteWorkOrderPartMutation(orgId, workOrderId);
	const createAssetMutation = useCreateWorkOrderAssetMutation(
		orgId,
		workOrderId,
	);
	const deleteAssetMutation = useDeleteWorkOrderAssetMutation(
		orgId,
		workOrderId,
	);
	const createAssetProcedureMutation = useCreateWorkOrderAssetProcedureMutation(
		orgId,
		workOrderId,
	);
	const deleteAssetProcedureMutation = useDeleteWorkOrderAssetProcedureMutation(
		orgId,
		workOrderId,
	);
	const createAssigneeMutation = useCreateWorkOrderAssigneeMutation(
		orgId,
		workOrderId,
	);
	const deleteAssigneeMutation = useDeleteWorkOrderAssigneeMutation(
		orgId,
		workOrderId,
	);
	const createProcedureMutation = useCreateWorkOrderProcedureMutation(
		orgId,
		workOrderId,
	);
	const deleteProcedureMutation = useDeleteWorkOrderProcedureMutation(
		orgId,
		workOrderId,
	);

	const combinedStatus = (
		...mutations: {
			isPending: boolean;
			isSuccess: boolean;
			isError: boolean;
		}[]
	): FieldStatus =>
		getMutationStatus({
			isPending: mutations.some((mt) => mt.isPending),
			isSuccess:
				!mutations.some((mt) => mt.isPending) &&
				mutations.some((mt) => mt.isSuccess),
			isError: mutations.some((mt) => mt.isError),
		});

	return {
		mode: "edit",
		parts: {
			items: workOrder.parts,
			onAdd: (part) =>
				createPartMutation.mutateAsync({ partId: part.id, plannedQuantity: 1 }),
			onRemove: (partId) => deletePartMutation.mutateAsync(partId),
			onChangePlanned: (partId, plannedQuantity) => {
				const existing = workOrder.parts.find((p) => p.id === partId);
				return updatePartMutation.mutateAsync({
					partId,
					plannedQuantity,
					usedQuantity: existing?.used_quantity ?? 0,
				});
			},
			onChangeUsed: (partId, usedQuantity) => {
				const existing = workOrder.parts.find((p) => p.id === partId);
				return updatePartMutation.mutateAsync({
					partId,
					plannedQuantity: existing?.planned_quantity ?? 1,
					usedQuantity,
				});
			},
		},
		assets: {
			seed: workOrder.assets ?? [],
			onAdd: (assetId) => createAssetMutation.mutateAsync(assetId),
			onRemove: (assetId) => deleteAssetMutation.mutateAsync(assetId),
			onAddProcedure: (assetId, procedureId) =>
				createAssetProcedureMutation.mutateAsync({ assetId, procedureId }),
			onRemoveProcedure: (assetId, procedureId) =>
				deleteAssetProcedureMutation.mutateAsync({ assetId, procedureId }),
		},
		assignees: {
			onAdd: (id) => createAssigneeMutation.mutateAsync(id),
			onRemove: (id) => deleteAssigneeMutation.mutateAsync(id),
		},
		procedures: {
			onAdd: (id) => createProcedureMutation.mutateAsync(id),
			onRemove: (id) => deleteProcedureMutation.mutateAsync(id),
		},
		status: {
			assets: combinedStatus(
				createAssetMutation,
				deleteAssetMutation,
				createAssetProcedureMutation,
				deleteAssetProcedureMutation,
			),
			parts: combinedStatus(
				createPartMutation,
				updatePartMutation,
				deletePartMutation,
			),
			assignees: combinedStatus(createAssigneeMutation, deleteAssigneeMutation),
			procedures: combinedStatus(
				createProcedureMutation,
				deleteProcedureMutation,
			),
		},
	};
}
