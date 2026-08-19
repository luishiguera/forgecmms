import { FieldSheet } from "@/components/field/field-sheet";
import { ProcedureRunner } from "@/components/procedure-runner";
import type { Responses } from "@/components/procedure-runner/validation";

export function ProcedureSheet({
	open,
	orgId,
	procedureId,
	title,
	responses,
	isSaving,
	onOpenChange,
	onSave,
}: {
	open: boolean;
	orgId: string;
	procedureId: number;
	title: string;
	responses: Responses;
	isSaving: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (responses: Responses) => void;
}) {
	return (
		<FieldSheet
			open={open}
			title={title}
			className="h-[92dvh] max-h-[92dvh]"
			onOpenChange={onOpenChange}
		>
			<div className="min-h-0 flex-1 overflow-y-auto p-4">
				<ProcedureRunner
					orgId={orgId}
					procedureId={procedureId}
					name={title}
					responses={responses}
					isSaving={isSaving}
					onSave={onSave}
				/>
			</div>
		</FieldSheet>
	);
}
