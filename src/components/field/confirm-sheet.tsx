import { FieldSheet } from "@/components/field/field-sheet";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import * as m from "@/paraglide/messages";

export function ConfirmSheet({
	open,
	title,
	message,
	confirmLabel,
	isSaving,
	onOpenChange,
	onConfirm,
}: {
	open: boolean;
	title: string;
	message: string;
	confirmLabel: string;
	isSaving?: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}) {
	return (
		<FieldSheet open={open} title={title} onOpenChange={onOpenChange}>
			<div className="flex flex-col gap-5 p-6">
				<p className="text-sm text-muted-foreground">{message}</p>

				<div className="flex flex-col gap-2">
					<Button
						type="button"
						size="xl"
						variant="destructive"
						disabled={isSaving}
						onClick={onConfirm}
					>
						{isSaving ? <Spinner /> : confirmLabel}
					</Button>
					<Button
						type="button"
						size="xl"
						variant="ghost"
						onClick={() => onOpenChange(false)}
					>
						{m.wo_button_cancel()}
					</Button>
				</div>
			</div>
		</FieldSheet>
	);
}
