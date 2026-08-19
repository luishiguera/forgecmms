import { CalendarIcon } from "@phosphor-icons/react/dist/csr/Calendar";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { CaretRightIcon } from "@phosphor-icons/react/dist/csr/CaretRight";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/csr/UsersThree";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import * as m from "@/paraglide/messages";
import { maxRangeMatcher } from "@/utils/date-range";

interface DateToolbarProps {
	fromDate: Date;
	toDate: Date;
	hasRange: boolean;
	isSingleDay: boolean;
	isToday: boolean;
	onPrev: () => void;
	onNext: () => void;
	onToday: () => void;
	onRangeSelect: (from: string | undefined, to: string | undefined) => void;
}

export function DateToolbar({
	fromDate,
	toDate,
	hasRange,
	isSingleDay,
	isToday,
	onPrev,
	onNext,
	onToday,
	onRangeSelect,
}: DateToolbarProps) {
	return (
		<div className="shrink-0 border-b bg-card px-3 lg:px-4 py-2 flex flex-wrap items-center gap-2">
			<span className="text-sm font-semibold mr-auto">
				{m.schedule_title()}
			</span>

			<Button
				variant="ghost"
				size="icon"
				onClick={onPrev}
				disabled={!isSingleDay}
			>
				<CaretLeftIcon className="size-4" weight="bold" />
			</Button>

			<Popover>
				<PopoverTrigger
					render={
						<Button variant="outline" size="sm" className="min-w-52">
							<CalendarIcon className="size-4 mr-2" weight="duotone" />
							{isSingleDay
								? format(fromDate, "EEEE, d MMM")
								: `${format(fromDate, "d MMM")} – ${format(toDate, "d MMM, yyyy")}`}
						</Button>
					}
				/>
				<PopoverContent className="w-auto p-0" align="center">
					<Calendar
						mode="range"
						disabled={maxRangeMatcher(
							hasRange ? fromDate : undefined,
							isSingleDay ? undefined : toDate,
						)}
						selected={
							hasRange
								? { from: fromDate, to: isSingleDay ? undefined : toDate }
								: undefined
						}
						onSelect={(range) =>
							onRangeSelect(
								range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
								range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
							)
						}
					/>
				</PopoverContent>
			</Popover>

			<Button
				variant="ghost"
				size="icon"
				onClick={onNext}
				disabled={!isSingleDay}
			>
				<CaretRightIcon className="size-4" weight="bold" />
			</Button>

			<Button
				variant={isToday ? "secondary" : "outline"}
				size="sm"
				onClick={onToday}
			>
				{m.schedule_today()}
			</Button>
		</div>
	);
}

interface TimelineToolbarProps {
	memberQuery: string;
	showAvailability: boolean;
	onMemberQuery: (value: string) => void;
	onToggleAvailability: (value: boolean) => void;
}

export function TimelineToolbar({
	memberQuery,
	showAvailability,
	onMemberQuery,
	onToggleAvailability,
}: TimelineToolbarProps) {
	return (
		<div className="shrink-0 border-b bg-card px-3 lg:px-4 py-2 flex flex-wrap items-center gap-3">
			<div className="flex items-center gap-2 mr-auto">
				<UsersThreeIcon
					className="size-4 text-muted-foreground"
					weight="duotone"
				/>
				<span className="text-sm font-semibold">
					{m.schedule_team_heading()}
				</span>
			</div>

			<label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
				<Checkbox
					checked={showAvailability}
					onCheckedChange={onToggleAvailability}
				/>
				{m.schedule_show_availability()}
			</label>

			<InputGroup className="w-48 h-8">
				<InputGroupAddon align="inline-start">
					<MagnifyingGlassIcon className="size-4" weight="duotone" />
				</InputGroupAddon>
				<InputGroupInput
					type="search"
					placeholder={m.schedule_search_member()}
					value={memberQuery}
					onChange={(e) => onMemberQuery(e.target.value)}
				/>
			</InputGroup>
		</div>
	);
}
