import { WarningIcon } from "@phosphor-icons/react/dist/csr/Warning";
import { FieldSheet } from "@/components/field/field-sheet";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import * as m from "@/paraglide/messages";
import type { WorkOrderPartItemResponse } from "@/server/domains/workorders/schema";

export function CompleteSheet({
	open,
	unusedParts,
	isSaving,
	onOpenChange,
	onConfirm,
}: {
	open: boolean;
	unusedParts: WorkOrderPartItemResponse[];
	isSaving: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}) {
	return (
		<FieldSheet
			open={open}
			title={m.wo_complete_title()}
			onOpenChange={onOpenChange}
		>
			<div className="flex flex-col gap-5 p-6">
				{unusedParts.length > 0 && (
					<div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/40">
						<div className="flex items-center gap-2">
							<WarningIcon
								className="size-[18px] shrink-0 text-amber-600 dark:text-amber-300"
								weight="fill"
							/>
							<p className="text-sm font-medium text-amber-600 dark:text-amber-300">
								{m.wo_unused_parts_title()}
							</p>
						</div>
						<ul className="mt-2 flex flex-col gap-1">
							{unusedParts.map((part) => (
								<li key={part.id} className="text-[13px]">
									{part.name}
								</li>
							))}
						</ul>
						<p className="mt-2 text-xs text-muted-foreground">
							{m.wo_unused_parts_note()}
						</p>
					</div>
				)}

				<div className="flex flex-col gap-2">
					<Button
						type="button"
						size="xl"
						disabled={isSaving}
						onClick={onConfirm}
					>
						{isSaving ? <Spinner /> : m.wo_mark_completed()}
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
