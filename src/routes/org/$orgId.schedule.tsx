import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { z } from "zod";
import type {
	ScheduleBlock,
	WorkOrder,
} from "@/components/ui/schedule-timeline";
import { Spinner } from "@/components/ui/spinner";
import { membersQueryOptions } from "@/lib/queries/members";
import { scheduleBlocksQueryOptions } from "@/lib/queries/schedule";
import { tracksQueryOptions } from "@/lib/queries/tracking";
import { meQueryOptions } from "@/lib/queries/user";
import {
	useAssignWorkOrderMutation,
	workOrdersQueryOptions,
} from "@/lib/queries/work-orders";
import {
	addDays as addDayKey,
	dayKey,
	minutesOfDay,
	startOfDay,
	startOfNextDay,
	todayKey,
	wallToInstant,
} from "@/utils/day";
import { memberAvailability } from "./$orgId.schedule/-availability";
import { MapFilters } from "./$orgId.schedule/-components";
import { ScheduleMap } from "./$orgId.schedule/-map";
import { PendingCardOverlay } from "./$orgId.schedule/-pending-card";
import { PendingQueue } from "./$orgId.schedule/-pending-queue";
import {
	parseDropZoneId,
	TimelinePanel,
} from "./$orgId.schedule/-timeline-panel";
import { DateToolbar, TimelineToolbar } from "./$orgId.schedule/-toolbar";
import {
	type LayerKey,
	queueAssignmentSchema,
	type SelectionType,
	toTimelineBlock,
	toTimelineWorkOrder,
	workOrderStatusSchema,
} from "./$orgId.schedule/-types";

const searchSchema = z.object({
	planned_start_from: z.string().optional(),
	planned_start_to: z.string().optional(),
	q: z.string().optional(),
	queue_q: z.string().optional(),
	queue_assignment: queueAssignmentSchema.optional(),
	queue_status: workOrderStatusSchema.optional(),
	layer_work_orders: z.boolean().optional(),
	layer_members: z.boolean().optional(),
	show_availability: z.boolean().optional(),
	sel_type: z.enum(["member", "wo"]).optional(),
	sel_id: z.number().optional(),
});

export const Route = createFileRoute("/org/$orgId/schedule")({
	validateSearch: searchSchema,
	component: RouteComponent,
});

function nextSlot(existing: WorkOrder[], day: string, timezone: string) {
	const used = new Set(
		existing
			.filter((w) => dayKey(w.start_time, timezone) === day)
			.map((w) => Math.floor(minutesOfDay(w.start_time, timezone) / 60)),
	);
	let hour = 8;
	while (hour < 17 && used.has(hour)) hour++;
	return {
		start: wallToInstant(day, hour * 60, timezone),
		end: wallToInstant(day, (hour + 1) * 60, timezone),
	};
}

function RouteComponent() {
	const { orgId } = Route.useParams();
	const { data: me } = useQuery(meQueryOptions());
	const timezone = me?.timezone ?? "UTC";
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	const setSearch = useCallback(
		(updates: Partial<z.infer<typeof searchSchema>>) => {
			navigate({ search: (prev) => ({ ...prev, ...updates }), replace: true });
		},
		[navigate],
	);

	const todayStr = todayKey(timezone);
	const fromStr = search.planned_start_from ?? todayStr;
	const toStr = search.planned_start_to ?? fromStr;
	const fromDate = useMemo(() => new Date(`${fromStr}T00:00:00`), [fromStr]);
	const toDate = useMemo(() => new Date(`${toStr}T00:00:00`), [toStr]);
	const hasRange = search.planned_start_from != null;
	const isSingleDay = fromStr === toStr;
	const isToday = isSingleDay && fromStr === todayStr;
	const memberQuery = search.q ?? "";
	const queueQuery = search.queue_q ?? "";
	const queueAssignment = search.queue_assignment;
	const queueStatus = search.queue_status;
	const showAvailability = search.show_availability ?? false;

	const layers = useMemo<Record<LayerKey, boolean>>(
		() => ({
			workOrders: search.layer_work_orders ?? true,
			members: search.layer_members ?? true,
		}),
		[search.layer_work_orders, search.layer_members],
	);

	const [activeDragId, setActiveDragId] = useState<number | null>(null);

	const days = useMemo(() => {
		const list: string[] = [];
		let current = fromStr;
		while (current <= toStr && list.length < 31) {
			list.push(current);
			current = addDayKey(current, 1);
		}
		return list;
	}, [fromStr, toStr]);

	const scheduledQuery = useQuery(
		workOrdersQueryOptions(orgId, {
			page: 1,
			size: 100,
			planned_start_from: fromStr,
			planned_start_to: toStr,
		}),
	);
	const queuePanelQuery = useQuery(
		workOrdersQueryOptions(orgId, {
			page: 1,
			size: 100,
			assignment: queueAssignment,
			status: queueStatus,
			planned_start_from: fromStr,
			planned_start_to: toStr,
		}),
	);
	const membersDataQuery = useQuery(
		membersQueryOptions(orgId, { access: "field", size: 100 }),
	);
	const techLocationsQuery = useQuery(
		tracksQueryOptions(orgId, {
			track_date_from: fromStr,
			track_date_to: toStr,
		}),
	);
	const blocksQuery = useQuery(
		scheduleBlocksQueryOptions(orgId, {
			page: 1,
			size: 100,
			date_from: startOfDay(fromStr, timezone).toISOString(),
			date_to: startOfNextDay(toStr, timezone).toISOString(),
		}),
	);

	const assignMutation = useAssignWorkOrderMutation(orgId);

	const scheduledWorkOrders = useMemo(
		() => scheduledQuery.data?.items ?? [],
		[scheduledQuery.data],
	);
	const queuePanelWorkOrders = useMemo(
		() => queuePanelQuery.data?.items ?? [],
		[queuePanelQuery.data],
	);
	const allMembers = useMemo(
		() => membersDataQuery.data?.items ?? [],
		[membersDataQuery.data],
	);
	const techLocations = techLocationsQuery.data?.items ?? [];

	const locatableMembers = new Set<number>();
	for (const t of techLocations) {
		if (t.user_id != null && t.latitude != null && t.longitude != null) {
			locatableMembers.add(t.user_id);
		}
	}

	const isLoading = scheduledQuery.isLoading || membersDataQuery.isLoading;

	const members = useMemo(() => {
		if (!memberQuery) return allMembers;
		const q = memberQuery.toLowerCase();
		return allMembers.filter(
			(m) =>
				m.full_name.toLowerCase().includes(q) ||
				m.email.toLowerCase().includes(q),
		);
	}, [allMembers, memberQuery]);

	const memberWorkOrders = useMemo(() => {
		const byMember = new Map<number, WorkOrder[]>();
		for (const wo of scheduledWorkOrders) {
			for (const assignee of wo.assignees) {
				if (assignee.id == null) continue;
				const list = byMember.get(assignee.id) ?? [];
				list.push(toTimelineWorkOrder(wo, assignee.id));
				byMember.set(assignee.id, list);
			}
		}
		return byMember;
	}, [scheduledWorkOrders]);

	const memberBlocks = useMemo(() => {
		const byMember = new Map<number, ScheduleBlock[]>();
		for (const block of blocksQuery.data?.items ?? []) {
			const mapped = toTimelineBlock(block);
			if (!mapped) continue;
			const list = byMember.get(mapped.member_id) ?? [];
			list.push(mapped);
			byMember.set(mapped.member_id, list);
		}
		return byMember;
	}, [blocksQuery.data]);

	const queueWorkOrders = useMemo(() => {
		const q = queueQuery.toLowerCase();
		if (!q) return queuePanelWorkOrders;
		return queuePanelWorkOrders.filter(
			(wo) => wo.title.toLowerCase().includes(q) || String(wo.id).includes(q),
		);
	}, [queuePanelWorkOrders, queueQuery]);

	const mapWorkOrders = queuePanelWorkOrders;

	const { startHour, endHour } = useMemo(() => {
		if (!showAvailability) return { startHour: 0, endHour: 24 };
		let min = 24;
		let max = 0;
		for (const member of allMembers) {
			for (const day of days) {
				const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
				const availability = memberAvailability(member, weekday);
				if (!availability) continue;
				if (availability.from < min) min = availability.from;
				if (availability.to > max) max = availability.to;
			}
		}
		if (max <= min) return { startHour: 0, endHour: 24 };
		return { startHour: Math.floor(min), endHour: Math.ceil(max) };
	}, [showAvailability, allMembers, days]);

	const focusTarget = useMemo(() => {
		const selType = search.sel_type;
		const selId = search.sel_id;
		if (!selType || selId == null) return null;
		const key = `${selType}-${selId}`;
		if (selType === "member") {
			const tech = techLocations.find((m) => m.user_id === selId);
			if (tech?.latitude != null && tech.longitude != null) {
				return { lng: tech.longitude, lat: tech.latitude, key };
			}
			return null;
		}
		const wo = mapWorkOrders.find((w) => w.id === selId);
		if (wo?.location?.latitude != null && wo.location.longitude != null) {
			return { lng: wo.location.longitude, lat: wo.location.latitude, key };
		}
		return null;
	}, [search.sel_type, search.sel_id, techLocations, mapWorkOrders]);

	const onSelect = useCallback(
		(type: SelectionType, id: number) => {
			setSearch({ sel_type: type, sel_id: id });
		},
		[setSearch],
	);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
	);

	const assignToMember = useCallback(
		(workOrderId: number, userId: number, day: string) => {
			const existing = memberWorkOrders.get(userId) ?? [];
			const slot = nextSlot(existing, day, timezone);
			assignMutation.mutate({
				workOrderId,
				userId,
				plannedStart: slot.start.toISOString(),
				plannedEnd: slot.end.toISOString(),
			});
		},
		[memberWorkOrders, assignMutation, timezone],
	);

	const handleDragStart = (event: DragStartEvent) => {
		const id = Number(String(event.active.id).replace("queue-", ""));
		setActiveDragId(Number.isFinite(id) ? id : null);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		setActiveDragId(null);
		const { active, over } = event;
		if (!over) return;
		const parsed = parseDropZoneId(String(over.id));
		if (!parsed) return;
		const woId = Number(String(active.id).replace("queue-", ""));
		assignToMember(woId, parsed.userId, parsed.day);
	};

	const handleAssign = (woId: number, memberId: number) =>
		assignToMember(woId, memberId, fromStr);

	const handleWorkOrderClick = (wo: WorkOrder) => onSelect("wo", wo.id);

	const activeDrag =
		activeDragId != null
			? queuePanelWorkOrders.find((w) => w.id === activeDragId)
			: undefined;

	return (
		<DndContext
			sensors={sensors}
			modifiers={[restrictToWindowEdges]}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<div className="flex h-full w-full flex-col min-h-0 overflow-hidden">
				<DateToolbar
					fromDate={fromDate}
					toDate={toDate}
					hasRange={hasRange}
					isSingleDay={isSingleDay}
					isToday={isToday}
					onPrev={() =>
						setSearch({
							planned_start_from: addDayKey(fromStr, -1),
							planned_start_to: undefined,
						})
					}
					onNext={() =>
						setSearch({
							planned_start_from: addDayKey(fromStr, 1),
							planned_start_to: undefined,
						})
					}
					onToday={() =>
						setSearch({
							planned_start_from: undefined,
							planned_start_to: undefined,
						})
					}
					onRangeSelect={(from, to) =>
						setSearch({ planned_start_from: from, planned_start_to: to })
					}
				/>

				<div className="relative flex-5 min-h-0 border-b">
					<ScheduleMap
						members={techLocations}
						workOrders={mapWorkOrders}
						layers={layers}
						focusTarget={focusTarget}
						onSelect={onSelect}
					/>
					<div className="absolute top-3 right-3 z-10">
						<MapFilters
							layers={layers}
							onToggleLayer={(key, value) => {
								const next = value ? undefined : false;
								if (key === "workOrders")
									setSearch({ layer_work_orders: next });
								if (key === "members") setSearch({ layer_members: next });
							}}
						/>
					</div>
				</div>

				<div className="flex flex-6 min-h-0">
					<div className="flex flex-1 min-w-0 flex-col">
						<TimelineToolbar
							memberQuery={memberQuery}
							showAvailability={showAvailability}
							onMemberQuery={(value) => setSearch({ q: value || undefined })}
							onToggleAvailability={(value) =>
								setSearch({ show_availability: value || undefined })
							}
						/>
						<div className="flex-1 overflow-auto bg-muted/30">
							{isLoading ? (
								<div className="flex items-center justify-center h-full">
									<Spinner />
								</div>
							) : (
								<TimelinePanel
									members={members}
									memberWorkOrders={memberWorkOrders}
									memberBlocks={memberBlocks}
									days={days}
									timezone={timezone}
									startHour={startHour}
									endHour={endHour}
									locatableMembers={locatableMembers}
									onWorkOrderClick={handleWorkOrderClick}
									onLocateMember={(userId) => onSelect("member", userId)}
								/>
							)}
						</div>
					</div>

					<PendingQueue
						orgId={orgId}
						workOrders={queueWorkOrders}
						members={allMembers}
						query={queueQuery}
						assignment={queueAssignment}
						status={queueStatus}
						onAssignment={(value) => setSearch({ queue_assignment: value })}
						onStatus={(value) => setSearch({ queue_status: value })}
						onQuery={(value) => setSearch({ queue_q: value || undefined })}
						onLocate={(woId) => onSelect("wo", woId)}
						onAssign={handleAssign}
					/>
				</div>
			</div>

			<DragOverlay>
				{activeDrag ? <PendingCardOverlay workOrder={activeDrag} /> : null}
			</DragOverlay>
		</DndContext>
	);
}
