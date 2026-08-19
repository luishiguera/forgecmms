import { useForm } from "@tanstack/react-form";
import type { WorkOrderResponse } from "@/server/domains/workorders/schema";
import { mapWorkOrderToFormValues } from "./-mappers";
import { DEFAULT_CREATE_VALUES, type WorkOrderFormValues } from "./-types";

export function useWorkOrderForm({
	mode,
	workOrder,
	onSubmit,
	onAutoSave,
}: {
	mode: "create" | "edit";
	workOrder?: WorkOrderResponse;
	onSubmit?: (values: WorkOrderFormValues) => Promise<void>;
	onAutoSave?: (values: WorkOrderFormValues) => Promise<void>;
}) {
	const isEditMode = mode === "edit";

	return useForm({
		defaultValues:
			isEditMode && workOrder
				? mapWorkOrderToFormValues(workOrder)
				: DEFAULT_CREATE_VALUES,
		listeners: isEditMode
			? {
					onChange: ({ formApi }) => {
						if (formApi.state.isValid && formApi.state.isDirty && onAutoSave) {
							formApi.handleSubmit();
						}
					},
					onChangeDebounceMs: 400,
				}
			: undefined,
		onSubmit: async ({ value }) => {
			if (isEditMode && onAutoSave) {
				await onAutoSave(value);
			} else if (onSubmit) {
				await onSubmit(value);
			}
		},
	});
}
