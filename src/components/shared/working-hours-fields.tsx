import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

export interface WorkingDay {
	weekday: number;
	enabled: boolean;
	from: string;
	to: string;
}

const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function dayLabel(weekday: number) {
	const date = new Date(2023, 0, 1 + weekday);
	const label = new Intl.DateTimeFormat(getLocale(), {
		weekday: "long",
	}).format(date);
	return label.charAt(0).toUpperCase() + label.slice(1);
}

interface WorkingHoursFieldsProps {
	value: WorkingDay[];
	onChange: (next: WorkingDay[]) => void;
}

export function WorkingHoursFields({
	value,
	onChange,
}: WorkingHoursFieldsProps) {
	const dayFor = (weekday: number): WorkingDay =>
		value.find((d) => d.weekday === weekday) ?? {
			weekday,
			enabled: false,
			from: "09:00",
			to: "18:00",
		};

	const update = (weekday: number, patch: Partial<WorkingDay>) => {
		const exists = value.some((d) => d.weekday === weekday);
		const next = exists
			? value.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d))
			: [...value, { ...dayFor(weekday), ...patch }];
		onChange(next);
	};

	return (
		<div className="@container/hours rounded-lg border divide-y">
			{DISPLAY_ORDER.map((weekday) => {
				const day = dayFor(weekday);
				return (
					<div
						key={weekday}
						className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5"
					>
						<Switch
							size="sm"
							checked={day.enabled}
							onCheckedChange={(checked) =>
								update(weekday, { enabled: checked })
							}
						/>
						<span
							className={cn(
								"min-w-0 flex-1 truncate text-sm font-medium",
								!day.enabled && "text-muted-foreground",
							)}
						>
							{dayLabel(weekday)}
						</span>
						{day.enabled ? (
							<div className="flex w-full items-center gap-1.5 @sm/hours:w-auto">
								<Input
									type="time"
									value={day.from}
									onChange={(e) => update(weekday, { from: e.target.value })}
									className="min-w-0 flex-1 tabular-nums @sm/hours:w-28 @sm/hours:flex-none"
								/>
								<span className="text-muted-foreground text-sm">–</span>
								<Input
									type="time"
									value={day.to}
									onChange={(e) => update(weekday, { to: e.target.value })}
									className="min-w-0 flex-1 tabular-nums @sm/hours:w-28 @sm/hours:flex-none"
								/>
							</div>
						) : (
							<span className="text-sm text-muted-foreground">
								{m.members_hours_off()}
							</span>
						)}
					</div>
				);
			})}
		</div>
	);
}
