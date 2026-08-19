import { PanelDetail, PanelDetailContent } from "@/components/ui/panel-layout";
import { useCreateAssetMutation } from "@/lib/queries/assets";
import { AssetForm, mapFormValuesToCreateRequest } from "./-asset-form";
import type { AssetFormValues } from "./-types";

interface AssetCreatePanelProps {
	orgId: string;
	onCreated: (assetId: number) => void;
	onCancel: () => void;
}

export function AssetCreatePanel({
	orgId,
	onCreated,
	onCancel,
}: AssetCreatePanelProps) {
	const createMutation = useCreateAssetMutation(orgId);

	const handleSubmit = async (values: AssetFormValues) => {
		const result = await createMutation.mutateAsync(
			mapFormValuesToCreateRequest(values),
		);
		onCreated(result.id);
	};

	const getFieldError = (fieldName: string): string | undefined => {
		if (createMutation.isError && fieldName === "serial_number") {
			return createMutation.error?.message;
		}
		return undefined;
	};

	const handleFieldChange = (fieldName: string) => {
		if (fieldName === "serial_number" && createMutation.isError) {
			createMutation.reset();
		}
	};

	return (
		<PanelDetail>
			<PanelDetailContent>
				<AssetForm
					mode="create"
					orgId={orgId}
					onSubmit={handleSubmit}
					onCancel={onCancel}
					isSubmitting={createMutation.isPending}
					getFieldError={getFieldError}
					handleFieldChange={handleFieldChange}
				/>
			</PanelDetailContent>
		</PanelDetail>
	);
}
