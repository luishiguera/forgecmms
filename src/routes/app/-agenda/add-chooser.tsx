import { CalendarDotsIcon } from "@phosphor-icons/react/dist/csr/CalendarDots";
import { CaretRightIcon } from "@phosphor-icons/react/dist/csr/CaretRight";
import { FieldSheet } from "@/components/field/field-sheet";
import * as m from "@/paraglide/messages";

export function AddChooserSheet({
	open,
	onOpenChange,
	onPickBlock,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onPickBlock: () => void;
}) {
	return (
		<FieldSheet
			open={open}
			title={m.agenda_add_title()}
			onOpenChange={onOpenChange}
		>
			<div className="p-6">
				<button
					type="button"
					onClick={onPickBlock}
					className="flex w-full items-center gap-3 rounded-xl p-3.5 text-left ring-1 ring-border transition-colors hover:bg-muted/40"
				>
					<span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-primary/10">
						<CalendarDotsIcon className="size-5 text-primary" />
					</span>
					<span className="min-w-0 flex-1">
						<span className="block text-[15px] font-semibold">
							{m.agenda_add_block()}
						</span>
						<span className="mt-0.5 block text-[13px] text-muted-foreground">
							{m.agenda_add_block_subtitle()}
						</span>
					</span>
					<CaretRightIcon className="size-5 shrink-0 text-muted-foreground" />
				</button>
			</div>
		</FieldSheet>
	);
}
