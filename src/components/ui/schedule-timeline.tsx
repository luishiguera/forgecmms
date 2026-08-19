import { CarIcon } from "@phosphor-icons/react/dist/csr/Car";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { ClockIcon } from "@phosphor-icons/react/dist/csr/Clock";
import { CoffeeIcon } from "@phosphor-icons/react/dist/csr/Coffee";
import { ProhibitIcon } from "@phosphor-icons/react/dist/csr/Prohibit";
import { UsersIcon } from "@phosphor-icons/react/dist/csr/Users";
import { WarningIcon } from "@phosphor-icons/react/dist/csr/Warning";
import { differenceInHours, differenceInMinutes, isBefore } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { dayKey, minutesOfDay, startOfNextDay, timeLabel } from "@/utils/day";

export type ScheduleBlockType = "break" | "travel" | "meeting" | "block";

export type ScheduleBlock = {
	id: number;
	type: ScheduleBlockType;
	start_time: Date;
	end_time: Date;
	member_id: number;
	note?: string;
};

export type WorkOrder = {
	id: number;
	public_id: number;
	title: string;
	customer_name: string;
	location: string;
	start_time: Date;
	end_time: Date;
	status:
		| "pending"
		| "reviewing"
		| "planned"
		| "in_progress"
		| "completed"
		| "closed";
	priority: "low" | "medium" | "high" | "urgent";
	member_id: number;
};

const HOUR_WIDTH = 160;

function positionFor(date: Date, timezone: string): number {
	return (minutesOfDay(date, timezone) / 60) * HOUR_WIDTH;
}

function getWidthForDuration(start: Date, end: Date): number {
	const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
	return durationHours * HOUR_WIDTH;
}

function formatDuration(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	if (hours === 0) return `${mins}m`;
	if (mins === 0) return `${hours}h`;
	return `${hours}h ${mins}m`;
}

const priorityColors: Record<string, string> = {
	low: "bg-slate-500",
	medium: "bg-blue-500",
	high: "bg-amber-500",
	urgent: "bg-red-500",
};

const statusBorderColors: Record<string, string> = {
	pending: "border-l-slate-400",
	in_progress: "border-l-blue-500",
	completed: "border-l-green-500",
};

const scheduleTypeStyles: Record<
	ScheduleBlockType,
	{ bg: string; border: string; text: string; icon: typeof CoffeeIcon }
> = {
	break: {
		bg: "bg-stone-200",
		border: "border-stone-400",
		text: "text-stone-700",
		icon: CoffeeIcon,
	},
	travel: {
		bg: "bg-sky-200",
		border: "border-sky-400",
		text: "text-sky-700",
		icon: CarIcon,
	},
	meeting: {
		bg: "bg-violet-200",
		border: "border-violet-400",
		text: "text-violet-700",
		icon: UsersIcon,
	},
	block: {
		bg: "bg-rose-200",
		border: "border-rose-400",
		text: "text-rose-700",
		icon: ProhibitIcon,
	},
};

interface TimelineHeaderProps {
	displayStartHour?: number;
	displayEndHour?: number;
}

export function TimelineHeader({
	displayStartHour = 0,
	displayEndHour = 24,
}: TimelineHeaderProps) {
	const displayHours = displayEndHour - displayStartHour;

	return (
		<div className="sticky top-0 bg-white dark:bg-background z-50 pb-2 pt-2 min-w-max">
			<div
				className="relative h-8 border-b border-border shrink-0"
				style={{ width: displayHours * HOUR_WIDTH }}
			>
				{Array.from({ length: displayHours + 1 }).map((_, i) => {
					const hour = displayStartHour + i;
					return (
						<div
							key={hour}
							className="absolute bottom-0 flex flex-col items-center"
							style={{ left: i * HOUR_WIDTH }}
						>
							<span className="text-[11px] text-muted-foreground font-medium mb-1.5">
								{hour.toString().padStart(2, "0")}:00
							</span>
							<div className="w-px h-2.5 bg-border" />
						</div>
					);
				})}
			</div>
		</div>
	);
}

interface ScheduleBlockCardProps {
	block: ScheduleBlock;
	onClick?: (block: ScheduleBlock) => void;
	getPosition: (date: Date) => number;
}

function ScheduleBlockCard({
	block,
	onClick,
	getPosition,
}: ScheduleBlockCardProps) {
	const styles = scheduleTypeStyles[block.type];
	const Icon = styles.icon;
	const blockWidth = getWidthForDuration(block.start_time, block.end_time);
	const durationMinutes = differenceInMinutes(block.end_time, block.start_time);
	const isSmall = blockWidth < 80;

	return (
		<div
			className={`absolute top-1.5 bottom-1.5 rounded-md border border-dashed overflow-hidden cursor-pointer ${styles.bg} ${styles.border}`}
			style={{
				left: getPosition(block.start_time),
				width: blockWidth,
			}}
			onClick={() => onClick?.(block)}
			onKeyDown={(e) => e.key === "Enter" && onClick?.(block)}
		>
			<div className="h-full p-2 flex flex-col min-w-0">
				{isSmall ? (
					<div className="flex flex-col items-center justify-center h-full gap-0.5">
						<Icon
							className={`size-4 shrink-0 ${styles.text}`}
							weight="duotone"
						/>
						<span
							className={`text-[8px] font-medium capitalize truncate ${styles.text}`}
						>
							{block.type}
						</span>
					</div>
				) : (
					<>
						<div className="flex items-center gap-1.5 shrink-0">
							<Icon
								className={`size-4 shrink-0 ${styles.text}`}
								weight="duotone"
							/>
							<span
								className={`text-[11px] font-medium capitalize truncate ${styles.text}`}
							>
								{block.type}
							</span>
						</div>
						<div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
							<ClockIcon className="size-3 shrink-0" weight="duotone" />
							<span>{formatDuration(durationMinutes)}</span>
						</div>
						{block.note && (
							<p className="text-[9px] text-muted-foreground truncate mt-1">
								{block.note}
							</p>
						)}
					</>
				)}
			</div>
		</div>
	);
}

interface WorkOrderCardProps {
	workOrder: WorkOrder;
	day: string;
	displayEndHour: number;
	timezone: string;
	onClick?: (workOrder: WorkOrder) => void;
	getPosition: (date: Date) => number;
}

function WorkOrderCard({
	workOrder: wo,
	day,
	displayEndHour,
	timezone,
	onClick,
	getPosition,
}: WorkOrderCardProps) {
	const priorityColor = priorityColors[wo.priority];
	const statusBorder = statusBorderColors[wo.status];

	const dayEnd = startOfNextDay(day, timezone);
	const isMultiDay =
		dayKey(wo.end_time, timezone) !== day && isBefore(dayEnd, wo.end_time);
	const clampedEnd = isMultiDay
		? new Date(dayEnd.getTime() - (24 - displayEndHour) * 3_600_000)
		: wo.end_time;

	const woWidth = getWidthForDuration(wo.start_time, clampedEnd);
	const durationMinutes = differenceInMinutes(wo.end_time, wo.start_time);
	const isSmall = woWidth < 80;
	const now = new Date();
	const isActiveStatus = wo.status !== "completed";
	const isOverdue = isActiveStatus && isBefore(wo.end_time, now);

	let multiDayLabel = "";
	if (isMultiDay) {
		const remainingHours = differenceInHours(wo.end_time, dayEnd);
		const remainingDays = Math.floor(remainingHours / 24);
		const leftoverHours = remainingHours % 24;
		if (remainingDays > 0) {
			multiDayLabel = `+${remainingDays}d ${leftoverHours}h`;
		} else {
			multiDayLabel = `tomorrow +${remainingHours}h`;
		}
	}

	return (
		<div
			className={`absolute top-1.5 bottom-1.5 rounded-md border-l-4 bg-background shadow-sm border border-border overflow-hidden cursor-pointer hover:border-primary/30 z-20 ${statusBorder}`}
			style={{
				left: getPosition(wo.start_time),
				width: woWidth,
			}}
			onClick={() => onClick?.(wo)}
			onKeyDown={(e) => e.key === "Enter" && onClick?.(wo)}
		>
			<div className="h-full p-2 flex flex-col min-w-0">
				<div className="flex items-center gap-1.5 shrink-0">
					<span className={`size-2 rounded-full shrink-0 ${priorityColor}`} />
					<span className="text-[10px] font-mono font-medium text-foreground">
						#{wo.public_id}
					</span>
					{!isSmall && isActiveStatus && (
						<span className="ml-auto flex items-center gap-0.5">
							{isOverdue ? (
								<>
									<WarningIcon className="size-3 text-red-500" weight="fill" />
									<span className="text-[9px] text-red-500 font-medium">
										Overdue
									</span>
								</>
							) : (
								<>
									<CheckCircleIcon
										className="size-3 text-emerald-500"
										weight="fill"
									/>
									<span className="text-[9px] text-emerald-500 font-medium">
										On time
									</span>
								</>
							)}
						</span>
					)}
				</div>

				<p className="text-[10px] font-medium text-foreground truncate mt-0.5">
					{wo.title}
				</p>
				{!isSmall && (
					<div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
						<ClockIcon className="size-3 shrink-0" weight="duotone" />
						<span>
							{timeLabel(wo.start_time, timezone)} ·{" "}
							{formatDuration(durationMinutes)}
						</span>
						{isMultiDay && (
							<span className="ml-auto text-[9px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1 py-0.5 rounded font-medium">
								{multiDayLabel}
							</span>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

interface TimelineBandProps {
	workOrders: WorkOrder[];
	scheduleBlocks: ScheduleBlock[];
	day: string;
	timezone: string;
	onWorkOrderClick?: (workOrder: WorkOrder) => void;
	onScheduleBlockClick?: (block: ScheduleBlock) => void;
	displayStartHour?: number;
	displayEndHour?: number;
}

export function TimelineBand({
	workOrders,
	scheduleBlocks,
	day,
	timezone,
	onWorkOrderClick,
	onScheduleBlockClick,
	displayStartHour = 0,
	displayEndHour = 24,
}: TimelineBandProps) {
	const displayHours = displayEndHour - displayStartHour;

	const getDisplayPosition = (date: Date): number =>
		positionFor(date, timezone) - displayStartHour * HOUR_WIDTH;

	return (
		<div
			className="relative h-24 rounded-lg border border-border overflow-hidden bg-background shrink-0"
			style={{ width: displayHours * HOUR_WIDTH }}
		>
			{Array.from({ length: displayHours }).map((_, i) => {
				const hour = displayStartHour + i;
				return (
					<div
						key={i}
						className={`absolute top-0 bottom-0 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
						style={{
							left: i * HOUR_WIDTH,
							width: HOUR_WIDTH,
						}}
					>
						<span className="absolute top-1 left-1 text-[9px] font-medium pointer-events-none text-muted-foreground/70">
							{hour.toString().padStart(2, "0")}:00
						</span>
					</div>
				);
			})}

			{(() => {
				const now = new Date();
				if (isBefore(startOfNextDay(day, timezone), now)) {
					return (
						<div
							className="absolute top-0 bottom-0 z-5"
							style={{
								left: 0,
								width: displayHours * HOUR_WIDTH,
								background:
									"repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(100,100,100,0.05) 2px, rgba(100,100,100,0.05) 4px)",
							}}
						/>
					);
				}
				if (dayKey(now, timezone) === day) {
					const currentHour = minutesOfDay(now, timezone) / 60;
					const pastWidth =
						Math.max(
							0,
							Math.min(currentHour, displayEndHour) - displayStartHour,
						) * HOUR_WIDTH;
					if (pastWidth > 0) {
						return (
							<div
								className="absolute top-0 bottom-0 z-5"
								style={{
									left: 0,
									width: pastWidth,
									background:
										"repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(100,100,100,0.05) 2px, rgba(100,100,100,0.05) 4px)",
								}}
							/>
						);
					}
				}
				return null;
			})()}

			{Array.from({ length: displayHours - 1 }).map((_, i) => (
				<div
					key={i}
					className="absolute top-0 bottom-0 w-px bg-border/20"
					style={{ left: (i + 1) * HOUR_WIDTH }}
				/>
			))}

			{(() => {
				const now = new Date();
				const currentHour = minutesOfDay(now, timezone) / 60;
				if (
					currentHour >= displayStartHour &&
					currentHour <= displayEndHour &&
					dayKey(now, timezone) === day
				) {
					return (
						<div
							className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20"
							style={{
								left: (currentHour - displayStartHour) * HOUR_WIDTH,
							}}
						/>
					);
				}
				return null;
			})()}

			{scheduleBlocks.map((block) => (
				<ScheduleBlockCard
					key={block.id}
					block={block}
					onClick={onScheduleBlockClick}
					getPosition={getDisplayPosition}
				/>
			))}

			{workOrders.map((wo) => (
				<WorkOrderCard
					key={wo.id}
					workOrder={wo}
					day={day}
					displayEndHour={displayEndHour}
					timezone={timezone}
					onClick={onWorkOrderClick}
					getPosition={getDisplayPosition}
				/>
			))}
		</div>
	);
}

interface MemberInfoProps {
	name: string;
	role?: string;
	photoUrl?: string;
}

export function MemberInfo({ name, role, photoUrl }: MemberInfoProps) {
	return (
		<div className="flex items-center gap-2 py-1 my-2">
			<Avatar className="size-6 text-[10px]">
				{photoUrl && <AvatarImage src={photoUrl} alt={name} />}
				<AvatarFallback>{name.charAt(0)}</AvatarFallback>
			</Avatar>
			<p className="font-medium text-sm truncate">{name}</p>
			{role && (
				<p className="text-xs text-muted-foreground capitalize">{role}</p>
			)}
		</div>
	);
}
