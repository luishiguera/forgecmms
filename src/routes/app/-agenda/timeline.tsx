import { ClockIcon } from "@phosphor-icons/react/dist/csr/Clock";
import { CubeIcon } from "@phosphor-icons/react/dist/csr/Cube";
import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin";
import { PlayCircleIcon } from "@phosphor-icons/react/dist/csr/PlayCircle";
import { InfoRow } from "@/components/field/detail-widgets";
import {
	PriorityBadge,
	StatusBadge,
} from "@/components/shared/work-order-badges";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages";
import { dayKey, durationLabel, timeLabel, timeParts } from "@/utils/day";
import {
	type AgendaBlock,
	BLOCK_TYPE_CONFIG,
	durationMinutes,
	railColor,
} from "./types";

const daySuffix = (block: AgendaBlock, timezone: string) => {
	const start = dayKey(block.start, timezone);
	const end = dayKey(block.end, timezone);
	if (start === end) return "";
	const days = Math.round(
		(Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) /
			86_400_000,
	);
	return ` +${days}`;
};

const initials = (name: string) => {
	const parts = name.trim().split(" ");
	if (parts.length >= 2)
		return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
	return name.slice(0, 2).toUpperCase();
};

function ClockRail({
	block,
	timezone,
	isFirst,
	isLast,
}: {
	block: AgendaBlock;
	timezone: string;
	isFirst: boolean;
	isLast: boolean;
}) {
	const { time, meridiem } = timeParts(block.start, timezone);

	return (
		<div className="relative w-13 shrink-0">
			{!(isFirst && isLast) && (
				<span
					className={cn(
						"absolute left-[0.75px] w-[2.5px] rounded-full bg-border",
						isFirst ? "top-5" : "top-0",
						isLast ? "h-5" : "bottom-0",
					)}
				/>
			)}
			{!isLast && (
				<span className="absolute top-[42px] bottom-1 left-[2px] w-1.5 bg-[repeating-linear-gradient(to_bottom,currentColor_0_1.5px,transparent_1.5px_22px)] text-border" />
			)}
			<span
				className={cn(
					"absolute top-[13px] left-0 h-3.5 w-1 rounded-full",
					railColor(block),
				)}
			/>
			<span className="absolute top-[11px] left-[14px] flex flex-col">
				<span className="text-xs leading-none font-bold tracking-[-0.3px]">
					{time}
				</span>
				{meridiem && (
					<span className="mt-0.5 text-[9px] leading-none font-semibold tracking-[0.3px] text-muted-foreground">
						{meridiem}
					</span>
				)}
			</span>
		</div>
	);
}

function WorkOrderCard({
	block,
	timezone,
	onOpen,
}: {
	block: AgendaBlock;
	timezone: string;
	onOpen: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onOpen}
			className="w-full rounded-xl bg-card p-4 text-left ring-1 ring-border transition-colors hover:bg-muted/40"
		>
			<div className="flex items-start justify-between gap-2">
				<span className="rounded-md bg-primary/10 px-2 py-1 text-[11px] font-semibold tracking-[0.3px] text-primary">
					#{block.id}
				</span>
				<div className="flex flex-wrap justify-end gap-1.5">
					{block.status && <StatusBadge status={block.status} />}
					{block.priority && <PriorityBadge priority={block.priority} />}
				</div>
			</div>

			<p className="mt-2.5 line-clamp-2 font-semibold leading-snug">
				{block.title}
			</p>
			{block.description && (
				<p className="mt-1 line-clamp-2 text-[13px] leading-[1.3] text-muted-foreground">
					{block.description}
				</p>
			)}

			{block.tags.length > 0 && (
				<div className="mt-2.5 flex flex-wrap gap-1.5">
					{block.tags.map((tag) => (
						<span
							key={tag}
							className="rounded-xl bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground"
						>
							{tag}
						</span>
					))}
				</div>
			)}

			<div className="mt-3 flex flex-col gap-2.5">
				<InfoRow
					icon={ClockIcon}
					label={m.agenda_scheduled()}
					value={`${timeLabel(block.start, timezone)} – ${timeLabel(
						block.end,
						timezone,
					)}`}
					valueSuffix={daySuffix(block, timezone)}
					subline={m.agenda_estimated_duration({
						duration: durationLabel(durationMinutes(block)),
					})}
				/>
				{block.actualStart && (
					<InfoRow
						icon={PlayCircleIcon}
						label={m.agenda_executed()}
						value={
							block.actualEnd
								? `${timeLabel(block.actualStart, timezone)} – ${timeLabel(
										block.actualEnd,
										timezone,
									)}`
								: `${timeLabel(block.actualStart, timezone)} – ${m.agenda_in_progress()}`
						}
						subline={
							block.actualEnd
								? m.agenda_actual_duration({
										duration: durationLabel(
											Math.round(
												(block.actualEnd.getTime() -
													block.actualStart.getTime()) /
													60_000,
											),
										),
									})
								: undefined
						}
					/>
				)}
				{block.locationName && (
					<InfoRow
						icon={MapPinIcon}
						label={block.locationName}
						value={block.locationAddress}
					/>
				)}
				{block.assetName && (
					<InfoRow
						icon={CubeIcon}
						label={m.agenda_asset()}
						value={block.assetName}
					/>
				)}
			</div>

			{block.assignee && (
				<div className="mt-3 flex items-center gap-2">
					<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-secondary-foreground">
						{initials(block.assignee)}
					</span>
					<span className="truncate text-[13px] text-muted-foreground">
						{block.assignee}
					</span>
				</div>
			)}
		</button>
	);
}

function CompactBlock({
	block,
	timezone,
	onDelete,
}: {
	block: AgendaBlock;
	timezone: string;
	onDelete: () => void;
}) {
	const config = BLOCK_TYPE_CONFIG[block.type];
	const Icon = config.icon;

	return (
		<button
			type="button"
			onClick={onDelete}
			className={cn(
				"flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left",
				config.tint,
			)}
		>
			<Icon className={cn("size-4 shrink-0", config.accent)} />
			<span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
				{block.title}
			</span>
			<span className={cn("text-[11px] font-medium", config.accent)}>
				{timeLabel(block.start, timezone)}–{timeLabel(block.end, timezone)}
				<span className="font-semibold opacity-50">
					{daySuffix(block, timezone)}
				</span>
			</span>
		</button>
	);
}

export function AgendaTimeline({
	blocks,
	timezone,
	className,
	onOpenWorkOrder,
	onDeleteBlock,
}: {
	blocks: AgendaBlock[];
	timezone: string;
	className?: string;
	onOpenWorkOrder: (workOrderId: number) => void;
	onDeleteBlock: (block: AgendaBlock) => void;
}) {
	return (
		<div className={cn("flex flex-col gap-2.5", className)}>
			{blocks.map((block, index) => (
				<div
					key={`${block.type}-${block.id}`}
					className="flex items-stretch gap-2"
				>
					<ClockRail
						block={block}
						timezone={timezone}
						isFirst={index === 0}
						isLast={index === blocks.length - 1}
					/>
					<div className="min-w-0 flex-1">
						{block.type === "work_order" ? (
							<WorkOrderCard
								block={block}
								timezone={timezone}
								onOpen={() => onOpenWorkOrder(block.id)}
							/>
						) : (
							<CompactBlock
								block={block}
								timezone={timezone}
								onDelete={() => onDeleteBlock(block)}
							/>
						)}
					</div>
				</div>
			))}
		</div>
	);
}
