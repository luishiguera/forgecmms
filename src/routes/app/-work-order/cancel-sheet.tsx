import { useState } from "react";
import { FieldSheet } from "@/components/field/field-sheet";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import * as m from "@/paraglide/messages";

export function CancelSheet({
	open,
	isSaving,
	onOpenChange,
	onConfirm,
}: {
	open: boolean;
	isSaving: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (reason: string) => void;
}) {
	const [reason, setReason] = useState("");
	const [isMissing, setIsMissing] = useState(false);

	const submit = () => {
		const value = reason.trim();
		if (!value) {
			setIsMissing(true);
			return;
		}
		onConfirm(value);
	};

	return (
		<FieldSheet
			open={open}
			title={m.wo_cancel_title()}
			onOpenChange={onOpenChange}
		>
			<div className="flex flex-col gap-4 p-6">
				<Textarea
					value={reason}
					rows={4}
					placeholder={m.wo_cancel_reason_hint()}
					aria-invalid={isMissing}
					onChange={(event) => {
						setReason(event.target.value);
						setIsMissing(false);
					}}
				/>
				{isMissing && (
					<p className="text-sm text-destructive">
						{m.wo_cancel_reason_required()}
					</p>
				)}

				<div className="flex flex-col gap-2">
					<Button
						type="button"
						size="xl"
						variant="destructive"
						disabled={isSaving}
						onClick={submit}
					>
						{isSaving ? <Spinner /> : m.wo_cancel_title()}
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
