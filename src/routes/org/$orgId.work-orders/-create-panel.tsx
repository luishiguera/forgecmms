import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { PanelDetail, PanelDetailContent } from "@/components/ui/panel-layout";
import { useCreateWorkOrderMutation } from "@/lib/queries/work-orders";
import { mapFormValuesToCreateRequest } from "./-mappers";
import type { WorkOrderFormValues } from "./-types";
import { WorkOrderCreateForm } from "./-work-order-create-form";

interface WorkOrderCreatePanelProps {
	orgId: string;
	onCreated: (workOrderId: number) => void;
	onCancel: () => void;
}

export function WorkOrderCreatePanel({
	orgId,
	onCreated,
	onCancel,
}: WorkOrderCreatePanelProps) {
	const createMutation = useCreateWorkOrderMutation(orgId);

	const handleSubmit = async (values: WorkOrderFormValues) => {
		const result = await createMutation.mutateAsync(
			mapFormValuesToCreateRequest(values) as any,
		);
		onCreated(result.id);
	};

	return (
		<PanelDetail>
			<PanelDetailContent>
				{createMutation.isError && (
					<Alert variant="destructive">
						<WarningCircleIcon weight="duotone" />
						<AlertTitle>{createMutation.error?.message}</AlertTitle>
					</Alert>
				)}

				<WorkOrderCreateForm
					orgId={orgId}
					onSubmit={handleSubmit}
					onCancel={onCancel}
					isSubmitting={createMutation.isPending}
				/>
			</PanelDetailContent>
		</PanelDetail>
	);
}
