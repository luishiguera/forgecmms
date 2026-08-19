import { MinusIcon } from "@phosphor-icons/react/dist/csr/Minus";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { useState } from "react";
import { FieldSheet } from "@/components/field/field-sheet";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import * as m from "@/paraglide/messages";
import type { WorkOrderPartItemResponse } from "@/server/domains/workorders/schema";

export function PartConsumptionSheet({
	open,
	part,
	isSaving,
	onOpenChange,
	onSave,
}: {
	open: boolean;
	part: WorkOrderPartItemResponse;
	isSaving: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (usedQuantity: number) => void;
}) {
	const [used, setUsed] = useState(part.used_quantity);

	return (
		<FieldSheet
			open={open}
			title={m.wo_part_consumption()}
			onOpenChange={onOpenChange}
		>
			<div className="flex flex-col gap-5 p-6">
				<div>
					<p className="text-[15px] font-semibold">{part.name}</p>
					{part.sku && (
						<p className="mt-0.5 text-[13px] text-muted-foreground">
							{part.sku}
						</p>
					)}
				</div>

				<div className="flex items-center justify-between">
					<span className="text-[15px] text-muted-foreground">
						{m.wo_parts_planned()}
					</span>
					<span className="text-[15px] font-semibold">
						{part.planned_quantity}
					</span>
				</div>

				<div className="flex items-center justify-between">
					<span className="text-[15px] font-semibold">{m.wo_parts_used()}</span>
					<div className="flex items-center gap-1 rounded-lg bg-muted p-1">
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={m.wo_parts_used()}
							disabled={used <= 0}
							onClick={() => setUsed((value) => Math.max(0, value - 1))}
						>
							<MinusIcon className="size-4" weight="bold" />
						</Button>
						<span className="w-10 text-center text-[15px] font-semibold tabular-nums">
							{used}
						</span>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={m.wo_parts_used()}
							onClick={() => setUsed((value) => value + 1)}
						>
							<PlusIcon className="size-4" weight="bold" />
						</Button>
					</div>
				</div>

				<Button
					type="button"
					size="xl"
					disabled={isSaving}
					onClick={() => onSave(used)}
				>
					{isSaving ? <Spinner /> : m.wo_button_save()}
				</Button>
			</div>
		</FieldSheet>
	);
}
