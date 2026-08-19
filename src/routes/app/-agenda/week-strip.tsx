import { CaretLeftIcon } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { CaretRightIcon } from "@phosphor-icons/react/dist/csr/CaretRight";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLocale } from "@/paraglide/runtime";
import { addDays } from "@/utils/day";

const weekdayLabel = (day: string) =>
	new Intl.DateTimeFormat(getLocale(), {
		timeZone: "UTC",
		weekday: "short",
	})
		.format(new Date(`${day}T00:00:00Z`))
		.replace(".", "");

export function WeekStrip({
	weekStart,
	selected,
	today,
	onSelect,
	onShiftWeek,
}: {
	weekStart: string;
	selected: string;
	today: string;
	onSelect: (day: string) => void;
	onShiftWeek: (weeks: number) => void;
}) {
	const days = Array.from({ length: 7 }, (_, index) =>
		addDays(weekStart, index),
	);

	return (
		<div className="flex items-center gap-1">
			<Button
				type="button"
				variant="ghost"
				size="icon"
				aria-label={weekStart}
				onClick={() => onShiftWeek(-1)}
			>
				<CaretLeftIcon className="size-[22px] text-muted-foreground" />
			</Button>

			<div className="grid flex-1 grid-cols-7">
				{days.map((day) => {
					const isSelected = day === selected;
					const isToday = day === today;
					return (
						<button
							key={day}
							type="button"
							onClick={() => onSelect(day)}
							className="flex flex-col items-center gap-1.5 rounded-xl py-1.5 transition-colors hover:bg-muted"
						>
							<span
								className={cn(
									"text-[11px] font-medium capitalize",
									isSelected ? "text-primary" : "text-muted-foreground",
								)}
							>
								{weekdayLabel(day)}
							</span>
							<span
								className={cn(
									"flex size-[34px] items-center justify-center rounded-full text-sm font-semibold",
									isSelected && "bg-primary text-primary-foreground",
									!isSelected && isToday && "ring-[1.5px] ring-primary",
								)}
							>
								{Number(day.slice(8))}
							</span>
						</button>
					);
				})}
			</div>

			<Button
				type="button"
				variant="ghost"
				size="icon"
				aria-label={addDays(weekStart, 7)}
				onClick={() => onShiftWeek(1)}
			>
				<CaretRightIcon className="size-[22px] text-muted-foreground" />
			</Button>
		</div>
	);
}
