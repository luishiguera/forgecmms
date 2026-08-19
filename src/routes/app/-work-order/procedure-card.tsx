import { CaretRightIcon } from "@phosphor-icons/react/dist/csr/CaretRight";
import { ListChecksIcon } from "@phosphor-icons/react/dist/csr/ListChecks";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { cn } from "@/lib/utils";
import {
	PROCEDURE_STATUS_STYLE,
	type ProcedureStatus,
	procedureStatusLabel,
} from "@/lib/work-orders/procedure-status";
import * as m from "@/paraglide/messages";

export function ProcedureCard({
	name,
	description,
	status,
	onOpen,
	onRemove,
}: {
	name: string;
	description?: string;
	status: ProcedureStatus;
	onOpen: () => void;
	onRemove: () => void;
}) {
	const style = PROCEDURE_STATUS_STYLE[status];

	return (
		<div
			className={cn(
				"relative flex items-center gap-3 rounded-[10px] px-4 pt-5 pb-4 ring-1",
				style.ring,
			)}
		>
			<button
				type="button"
				onClick={onOpen}
				className="flex min-w-0 flex-1 items-center gap-3 text-left"
			>
				<ListChecksIcon className="size-[22px] shrink-0 text-muted-foreground" />
				<span className="min-w-0 flex-1">
					<span className="block truncate text-[15px] font-medium">{name}</span>
					{description && (
						<span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
							{description}
						</span>
					)}
				</span>
			</button>

			<button
				type="button"
				onClick={onRemove}
				aria-label={m.wo_remove_procedure()}
				className="p-1 text-muted-foreground"
			>
				<XIcon className="size-[18px]" />
			</button>
			<button
				type="button"
				onClick={onOpen}
				aria-label={m.wo_open_procedure()}
				className="p-1 text-muted-foreground"
			>
				<CaretRightIcon className="size-5 shrink-0" />
			</button>

			<span
				className={cn(
					"absolute -top-2.5 right-3 rounded border px-2 py-[3px] text-[10px] font-semibold",
					style.tab,
				)}
			>
				{procedureStatusLabel(status)}
			</span>
		</div>
	);
}
