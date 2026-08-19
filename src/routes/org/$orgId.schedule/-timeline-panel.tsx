import { useDroppable } from "@dnd-kit/core";
import { NavigationArrowIcon } from "@phosphor-icons/react/dist/csr/NavigationArrow";
import { UsersIcon } from "@phosphor-icons/react/dist/csr/Users";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
	MemberInfo,
	type ScheduleBlock,
	TimelineBand,
	TimelineHeader,
	type WorkOrder,
} from "@/components/ui/schedule-timeline";
import * as m from "@/paraglide/messages";
import type { MemberResponse } from "@/server/domains/organizations/schema";
import { dayKey, todayKey } from "@/utils/day";

export const dropZoneId = (userId: number, day: string) =>
	`drop:${userId}:${day}`;

export function parseDropZoneId(
	id: string,
): { userId: number; day: string } | null {
	if (!id.startsWith("drop:")) return null;
	const [, userId, day] = id.split(":");
	return { userId: Number(userId), day };
}

interface MemberRowProps {
	member: MemberResponse;
	workOrders: WorkOrder[];
	blocks: ScheduleBlock[];
	day: string;
	timezone: string;
	startHour: number;
	endHour: number;
	locatable: boolean;
	onWorkOrderClick: (wo: WorkOrder) => void;
	onLocateMember: (userId: number) => void;
}

function MemberRow({
	member,
	workOrders,
	blocks,
	day,
	timezone,
	startHour,
	endHour,
	locatable,
	onWorkOrderClick,
	onLocateMember,
}: MemberRowProps) {
	const { setNodeRef, isOver } = useDroppable({
		id: dropZoneId(member.user_id, day),
	});

	return (
		<div>
			<div className="flex items-center gap-1">
				<MemberInfo name={member.full_name} photoUrl={member.photo_url} />
				{locatable && (
					<Button
						variant="ghost"
						size="sm"
						className="h-7 text-xs shrink-0"
						onClick={() => onLocateMember(member.user_id)}
					>
						<NavigationArrowIcon className="size-3.5 mr-1" weight="duotone" />
						{m.schedule_locate()}
					</Button>
				)}
			</div>
			<div
				ref={setNodeRef}
				className={`rounded-lg transition-colors ${isOver ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
			>
				<TimelineBand
					workOrders={workOrders}
					scheduleBlocks={blocks}
					day={day}
					timezone={timezone}
					displayStartHour={startHour}
					displayEndHour={endHour}
					onWorkOrderClick={onWorkOrderClick}
				/>
			</div>
		</div>
	);
}

interface DaySectionProps {
	day: string;
	withHeader: boolean;
	members: MemberResponse[];
	memberWorkOrders: Map<number, WorkOrder[]>;
	memberBlocks: Map<number, ScheduleBlock[]>;
	timezone: string;
	startHour: number;
	endHour: number;
	locatableMembers: Set<number>;
	onWorkOrderClick: (wo: WorkOrder) => void;
	onLocateMember: (userId: number) => void;
}

function DaySection({
	day,
	withHeader,
	members,
	memberWorkOrders,
	memberBlocks,
	timezone,
	startHour,
	endHour,
	locatableMembers,
	onWorkOrderClick,
	onLocateMember,
}: DaySectionProps) {
	const isToday = day === todayKey(timezone);
	return (
		<div>
			{withHeader && (
				<div className="flex items-center gap-2 mb-2 sticky top-0 bg-white dark:bg-background z-30 py-2">
					<span
						className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}
					>
						{format(new Date(`${day}T00:00:00`), "EEEE, d MMM")}
					</span>
					{isToday && (
						<span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
							{m.schedule_today()}
						</span>
					)}
				</div>
			)}
			{!withHeader && (
				<TimelineHeader displayStartHour={startHour} displayEndHour={endHour} />
			)}
			<div className="space-y-3">
				{members.map((member) => {
					const all = memberWorkOrders.get(member.user_id) ?? [];
					const wos = all.filter(
						(wo) => dayKey(wo.start_time, timezone) === day,
					);
					const blocks = (memberBlocks.get(member.user_id) ?? []).filter(
						(b) => dayKey(b.start_time, timezone) === day,
					);
					return (
						<MemberRow
							key={member.user_id}
							member={member}
							workOrders={wos}
							blocks={blocks}
							day={day}
							timezone={timezone}
							startHour={startHour}
							endHour={endHour}
							locatable={locatableMembers.has(member.user_id)}
							onWorkOrderClick={onWorkOrderClick}
							onLocateMember={onLocateMember}
						/>
					);
				})}
			</div>
		</div>
	);
}

interface TimelinePanelProps {
	members: MemberResponse[];
	memberWorkOrders: Map<number, WorkOrder[]>;
	memberBlocks: Map<number, ScheduleBlock[]>;
	days: string[];
	timezone: string;
	startHour: number;
	endHour: number;
	locatableMembers: Set<number>;
	onWorkOrderClick: (wo: WorkOrder) => void;
	onLocateMember: (userId: number) => void;
}

export function TimelinePanel({
	members,
	memberWorkOrders,
	memberBlocks,
	days,
	timezone,
	startHour,
	endHour,
	locatableMembers,
	onWorkOrderClick,
	onLocateMember,
}: TimelinePanelProps) {
	if (members.length === 0) {
		return (
			<div className="flex items-center justify-center h-full p-6">
				<div className="text-center text-muted-foreground">
					<UsersIcon
						className="size-8 mx-auto mb-2 opacity-50"
						weight="duotone"
					/>
					<p className="text-sm">{m.schedule_no_members()}</p>
				</div>
			</div>
		);
	}

	const multiDay = days.length > 1;

	return (
		<div className="px-4 lg:px-6 pb-6 space-y-6">
			{days.map((day) => (
				<DaySection
					key={day}
					day={day}
					withHeader={multiDay}
					members={members}
					memberWorkOrders={memberWorkOrders}
					memberBlocks={memberBlocks}
					timezone={timezone}
					startHour={startHour}
					endHour={endHour}
					locatableMembers={locatableMembers}
					onWorkOrderClick={onWorkOrderClick}
					onLocateMember={onLocateMember}
				/>
			))}
		</div>
	);
}
