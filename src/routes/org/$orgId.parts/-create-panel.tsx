import { PanelDetail, PanelDetailContent } from "@/components/ui/panel-layout";
import { useCreatePartMutation } from "@/lib/queries/parts";
import { mapFormValuesToCreateRequest, PartForm } from "./-part-form";
import type { PartFormValues } from "./-types";

interface PartCreatePanelProps {
	orgId: string;
	onCreated: (partId: number) => void;
	onCancel: () => void;
}

export function PartCreatePanel({
	orgId,
	onCreated,
	onCancel,
}: PartCreatePanelProps) {
	const createMutation = useCreatePartMutation(orgId);

	const handleSubmit = async (values: PartFormValues) => {
		const result = await createMutation.mutateAsync(
			mapFormValuesToCreateRequest(values),
		);
		onCreated(result.id);
	};

	const getFieldError = (fieldName: string): string | undefined => {
		if (createMutation.isError && fieldName === "sku") {
			return createMutation.error?.message;
		}
		return undefined;
	};

	const handleFieldChange = (fieldName: string) => {
		if (fieldName === "sku" && createMutation.isError) {
			createMutation.reset();
		}
	};

	return (
		<PanelDetail>
			<PanelDetailContent>
				<PartForm
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
