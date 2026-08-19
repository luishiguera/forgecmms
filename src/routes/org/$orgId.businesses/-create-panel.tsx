import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { PanelDetail, PanelDetailContent } from "@/components/ui/panel-layout";
import { useCreateBusinessMutation } from "@/lib/queries/businesses";
import { BusinessForm, mapFormValuesToCreateRequest } from "./-business-form";
import type { BusinessFormValues } from "./-types";

interface BusinessCreatePanelProps {
	orgId: string;
	onCreated: (businessId: number) => void;
	onCancel: () => void;
}

export function BusinessCreatePanel({
	orgId,
	onCreated,
	onCancel,
}: BusinessCreatePanelProps) {
	const createMutation = useCreateBusinessMutation(orgId);

	const handleSubmit = async (values: BusinessFormValues) => {
		const result = await createMutation.mutateAsync(
			mapFormValuesToCreateRequest(values),
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

				<BusinessForm
					mode="create"
					orgId={orgId}
					onSubmit={handleSubmit}
					onCancel={onCancel}
					isSubmitting={createMutation.isPending}
				/>
			</PanelDetailContent>
		</PanelDetail>
	);
}
