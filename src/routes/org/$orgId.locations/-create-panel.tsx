import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { PanelDetail, PanelDetailContent } from "@/components/ui/panel-layout";
import { useCreateLocationMutation } from "@/lib/queries/locations";
import { LocationForm, mapFormValuesToCreateRequest } from "./-location-form";
import type { LocationFormValues } from "./-types";

interface LocationCreatePanelProps {
	orgId: string;
	onCreated: (locationId: number) => void;
	onCancel: () => void;
}

export function LocationCreatePanel({
	orgId,
	onCreated,
	onCancel,
}: LocationCreatePanelProps) {
	const createMutation = useCreateLocationMutation(orgId);

	const handleSubmit = async (values: LocationFormValues) => {
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

				<LocationForm
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
