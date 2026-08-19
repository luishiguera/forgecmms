import { CalendarCheckIcon } from "@phosphor-icons/react/dist/csr/CalendarCheck";
import { FadersHorizontalIcon } from "@phosphor-icons/react/dist/csr/FadersHorizontal";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { FieldTopBar } from "@/components/field/top-bar";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import {
	scheduleBlocksQueryOptions,
	useCreateScheduleBlockMutation,
	useDeleteScheduleBlockMutation,
} from "@/lib/queries/schedule";
import { meQueryOptions } from "@/lib/queries/user";
import { workOrdersQueryOptions } from "@/lib/queries/work-orders";
import { useTimeFormat } from "@/lib/time-format";
import { cn } from "@/lib/utils";
import { workOrderStatusSchema } from "@/lib/work-orders/status";
import * as m from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import {
	addDays,
	dayKey,
	durationLabel,
	todayKey,
	weekStartKey,
} from "@/utils/day";
import { AddChooserSheet } from "./-agenda/add-chooser";
import { CreateBlockSheet } from "./-agenda/create-block";
import { FilterSheet } from "./-agenda/filter-sheet";
import { AgendaTimeline } from "./-agenda/timeline";
import {
	type AgendaBlock,
	type AgendaFilter,
	durationMinutes,
	fromScheduleBlock,
	fromWorkOrder,
	hasActiveFilters,
} from "./-agenda/types";
import { WeekStrip } from "./-agenda/week-strip";

const searchSchema = z.object({
	day: z.iso.date().optional().catch(undefined),
	assigned: z.boolean().optional().catch(undefined),
	status: workOrderStatusSchema.optional().catch(undefined),
});

export const Route = createFileRoute("/app/$orgId/")({
	validateSearch: searchSchema,
	component: RouteComponent,
});

const dateHeading = (day: string) =>
	new Intl.DateTimeFormat(getLocale(), {
		timeZone: "UTC",
		weekday: "long",
		day: "numeric",
		month: "short",
	}).format(new Date(`${day}T00:00:00Z`));

function RouteComponent() {
	const { orgId } = Route.useParams();
	const search = Route.useSearch();
	const navigate = useNavigate();

	useTimeFormat();

	const { data: me } = useQuery(meQueryOptions());
	const timezone = me?.timezone ?? "UTC";
	const today = todayKey(timezone);

	const filter: AgendaFilter = {
		assigned: search.assigned ?? true,
		status: search.status,
	};
	const selected = search.day ?? today;

	const [weekStart, setWeekStart] = useState(() => weekStartKey(selected));
	const [isCreating, setIsCreating] = useState(false);
	const [isChoosing, setIsChoosing] = useState(false);
	const [filterEpoch, setFilterEpoch] = useState(0);
	const [isFiltering, setIsFiltering] = useState(false);
	const [pendingDelete, setPendingDelete] = useState<AgendaBlock | null>(null);

	const createBlock = useCreateScheduleBlockMutation(orgId);
	const deleteBlock = useDeleteScheduleBlockMutation(orgId);

	const workOrders = useQuery({
		...workOrdersQueryOptions(orgId, {
			assignee_id: filter.assigned ? me?.id : undefined,
			status: filter.status,
			planned_start_from: selected,
			planned_start_to: selected,
			size: 100,
		}),
		enabled: !!me,
	});

	const blocks = useQuery({
		...scheduleBlocksQueryOptions(orgId, {
			user_id: me?.id,
			date_from: `${addDays(selected, -1)}T00:00:00Z`,
			date_to: `${addDays(selected, 2)}T00:00:00Z`,
			size: 100,
		}),
		enabled: !!me,
	});

	const agenda: AgendaBlock[] = [
		...(workOrders.data?.items ?? [])
			.map(fromWorkOrder)
			.filter((block): block is AgendaBlock => block !== null),
		...(blocks.data?.items ?? [])
			.map(fromScheduleBlock)
			.filter((block) => dayKey(block.start, timezone) === selected),
	].sort((a, b) => a.start.getTime() - b.start.getTime());

	const totalMinutes = agenda.reduce(
		(sum, block) => sum + durationMinutes(block),
		0,
	);

	const toSearch = (next: AgendaFilter & { day?: string }) => ({
		day: next.day,
		assigned: next.assigned === true ? undefined : next.assigned,
		status: next.status,
	});

	const selectDay = (next: string) => {
		navigate({
			to: "/app/$orgId",
			params: { orgId },
			search: toSearch({ ...filter, day: next === today ? undefined : next }),
		});
	};

	const applyFilter = (next: AgendaFilter) => {
		navigate({
			to: "/app/$orgId",
			params: { orgId },
			search: toSearch({
				...next,
				day: selected === today ? undefined : selected,
			}),
		});
	};

	const goToday = () => {
		setWeekStart(weekStartKey(today));
		selectDay(today);
	};

	const isLoading = workOrders.isPending || blocks.isPending;
	const isError = workOrders.isError || blocks.isError;
	const isFilterActive = hasActiveFilters(filter);

	const refresh = () => {
		workOrders.refetch();
		blocks.refetch();
	};

	return (
		<div className="relative flex flex-1 min-h-0 flex-col">
			<FieldTopBar orgId={orgId} onRefresh={refresh} />

			<div className="flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto px-4 pt-4 pb-28">
				<div className="flex items-start justify-between gap-3">
					<div>
						<h1 className="text-lg font-semibold tracking-[-0.5px]">
							{m.agenda_title()}
						</h1>
						<p className="mt-1 text-sm capitalize text-muted-foreground">
							{dateHeading(selected)}
						</p>
					</div>
					<button
						type="button"
						onClick={() => {
							setFilterEpoch((epoch) => epoch + 1);
							setIsFiltering(true);
						}}
						className={cn(
							"flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium ring-1",
							isFilterActive
								? "bg-primary/10 text-primary ring-primary"
								: "bg-muted text-muted-foreground ring-border",
						)}
					>
						<FadersHorizontalIcon className="size-4" />
						{m.agenda_filters()}
					</button>
				</div>

				<WeekStrip
					weekStart={weekStart}
					selected={selected}
					today={today}
					onSelect={selectDay}
					onShiftWeek={(weeks) => setWeekStart(addDays(weekStart, weeks * 7))}
				/>

				<div className="flex items-center">
					<span className="h-px flex-1 bg-border" />
					{selected !== today && (
						<button
							type="button"
							onClick={goToday}
							className="pr-3 pl-2 text-[13px] font-semibold text-primary"
						>
							{m.agenda_today()}
						</button>
					)}
				</div>

				{isLoading ? (
					<div className="flex flex-1 items-center justify-center">
						<Spinner className="size-8 text-primary" />
					</div>
				) : isError ? (
					<div className="flex flex-1 flex-col items-center justify-center px-12 text-center">
						<WarningCircleIcon className="size-12 text-muted-foreground" />
						<p className="mt-4 text-sm text-muted-foreground">
							{m.agenda_error()}
						</p>
						<Button
							type="button"
							variant="outline"
							className="mt-4"
							onClick={refresh}
						>
							{m.agenda_retry()}
						</Button>
					</div>
				) : agenda.length === 0 ? (
					<Empty className="flex-1 gap-0 py-12">
						<CalendarCheckIcon className="size-16 text-muted-foreground/50" />
						<EmptyTitle className="mt-4 text-lg font-semibold">
							{m.agenda_empty_title()}
						</EmptyTitle>
						<EmptyDescription className="mt-2 text-sm">
							{m.agenda_empty_description()}
						</EmptyDescription>
					</Empty>
				) : (
					<>
						<p className="mt-1 text-right text-xs font-medium text-muted-foreground">
							{m.agenda_summary({
								count: agenda.length,
								duration: durationLabel(totalMinutes),
							})}
						</p>
						<AgendaTimeline
							className="-ml-4"
							blocks={agenda}
							timezone={timezone}
							onOpenWorkOrder={(workOrderId) =>
								navigate({
									to: "/app/$orgId/work-orders/$workOrderId",
									params: { orgId, workOrderId: workOrderId.toString() },
								})
							}
							onDeleteBlock={setPendingDelete}
						/>
					</>
				)}
			</div>

			<Button
				type="button"
				size="icon"
				aria-label={m.agenda_add_block()}
				className="absolute right-6 bottom-6 size-14 rounded-full"
				onClick={() => setIsChoosing(true)}
			>
				<PlusIcon className="size-6" weight="bold" />
			</Button>

			<AddChooserSheet
				open={isChoosing}
				onOpenChange={setIsChoosing}
				onPickBlock={() => {
					setIsChoosing(false);
					setIsCreating(true);
				}}
			/>

			<FilterSheet
				key={filterEpoch}
				open={isFiltering}
				value={filter}
				onOpenChange={setIsFiltering}
				onApply={applyFilter}
			/>

			<CreateBlockSheet
				open={isCreating}
				day={selected}
				timezone={timezone}
				isSaving={createBlock.isPending}
				onOpenChange={setIsCreating}
				onSubmit={(values) => {
					if (!me) return;
					createBlock.mutate(
						{ user_id: me.id, ...values },
						{ onSuccess: () => setIsCreating(false) },
					);
				}}
			/>

			<AlertDialog
				open={!!pendingDelete}
				onOpenChange={(open) => !open && setPendingDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{m.agenda_delete_title()}</AlertDialogTitle>
						<AlertDialogDescription>
							{m.agenda_delete_confirm()}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{m.agenda_cancel()}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (pendingDelete) deleteBlock.mutate(pendingDelete.id);
								setPendingDelete(null);
							}}
						>
							{m.agenda_delete()}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
