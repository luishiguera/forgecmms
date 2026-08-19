import { useState } from "react";
import { FieldSheet } from "@/components/field/field-sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
	getStatusLabel,
	WORK_ORDER_STATUSES,
	type WorkOrderStatus,
} from "@/lib/work-orders/status";
import * as m from "@/paraglide/messages";
import type { AgendaFilter } from "./types";

export function FilterSheet({
	open,
	value,
	onOpenChange,
	onApply,
}: {
	open: boolean;
	value: AgendaFilter;
	onOpenChange: (open: boolean) => void;
	onApply: (filter: AgendaFilter) => void;
}) {
	const [assigned, setAssigned] = useState(value.assigned);
	const [status, setStatus] = useState<WorkOrderStatus | undefined>(
		value.status,
	);

	return (
		<FieldSheet
			open={open}
			title={m.agenda_filters()}
			action={
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="text-destructive hover:text-destructive"
					onClick={() => {
						onApply({ assigned: true });
						onOpenChange(false);
					}}
				>
					{m.agenda_filter_clear()}
				</Button>
			}
			onOpenChange={onOpenChange}
		>
			<div className="flex min-h-0 flex-col gap-5 overflow-y-auto p-6">
				<div>
					<p className="text-[13px] font-medium tracking-[0.3px] text-muted-foreground">
						{m.agenda_filter_assigned()}
					</p>
					<div
						className={cn(
							"mt-2.5 flex items-center justify-between gap-4 rounded-[10px] px-4 py-3.5 ring-1",
							assigned ? "bg-primary/10 ring-primary" : "ring-border",
						)}
					>
						<span className={cn("text-[15px]", assigned && "font-medium")}>
							{m.agenda_filter_assigned()}
						</span>
						<Switch checked={assigned} onCheckedChange={setAssigned} />
					</div>
				</div>

				<div>
					<p className="text-[13px] font-medium tracking-[0.3px] text-muted-foreground">
						{m.agenda_filter_status()}
					</p>
					<div className="mt-2.5 flex flex-wrap gap-2">
						{WORK_ORDER_STATUSES.map((option) => {
							const isSelected = option === status;
							return (
								<button
									key={option}
									type="button"
									onClick={() => setStatus(isSelected ? undefined : option)}
									className={cn(
										"rounded-full px-3.5 py-2 text-[13px] ring-1",
										isSelected
											? "bg-primary/10 font-medium text-primary ring-primary"
											: "ring-border",
									)}
								>
									{getStatusLabel(option)}
								</button>
							);
						})}
					</div>
				</div>

				<Button
					type="button"
					size="xl"
					onClick={() => {
						onApply({ assigned, status });
						onOpenChange(false);
					}}
				>
					{m.agenda_filter_apply()}
				</Button>
			</div>
		</FieldSheet>
	);
}
