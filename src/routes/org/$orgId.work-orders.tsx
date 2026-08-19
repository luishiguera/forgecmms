import { CalendarIcon } from "@phosphor-icons/react/dist/csr/Calendar";
import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import { ClipboardTextIcon } from "@phosphor-icons/react/dist/csr/ClipboardText";
import { FunnelIcon } from "@phosphor-icons/react/dist/csr/Funnel";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { z } from "zod";
import {
	PRIORITY_CONFIG,
	STATUS_CONFIG,
	WorkOrderListItem,
} from "@/components/shared/work-order-list-item";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FilterTrigger } from "@/components/ui/filter-trigger";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	PanelEmpty,
	PanelLayout,
	PanelList,
} from "@/components/ui/panel-layout";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { VirtualPanelList } from "@/components/ui/virtual-panel-list";
import { useDebounce } from "@/hooks/use-debounce";
import { workOrdersInfiniteQueryOptions } from "@/lib/queries/work-orders";
import {
	WORK_ORDER_PRIORITIES as ALL_PRIORITIES,
	getPriorityLabel,
} from "@/lib/work-orders/labels";
import { workOrderStatusSchema } from "@/lib/work-orders/status";
import * as m from "@/paraglide/messages";
import { maxRangeMatcher } from "@/utils/date-range";
import { WorkOrderCreatePanel } from "./$orgId.work-orders/-create-panel";
import { WorkOrderDetailPanel } from "./$orgId.work-orders/-detail-panel";
import { ALL_STATUSES, getStatusLabel } from "./$orgId.work-orders/-types";

const searchSchema = z.object({
	id: z.number().optional(),
	q: z.string().optional(),
	create: z.boolean().optional(),
	status: workOrderStatusSchema.optional(),
	priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
	planned_start_from: z.string().optional(),
	planned_start_to: z.string().optional(),
	tab: z.enum(["overview", "execution", "related", "attachments"]).optional(),
});

export const Route = createFileRoute("/org/$orgId/work-orders")({
	validateSearch: searchSchema,
	component: RouteComponent,
});

function RouteComponent() {
	const { orgId } = Route.useParams();
	const searchParams = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	const search = searchParams.q ?? "";
	const debouncedSearch = useDebounce(search, 300);
	const isCreating = searchParams.create === true;

	const selectedWorkOrderId = searchParams.id ?? null;

	const setSelectedWorkOrderId = (id: number | null) => {
		navigate({
			search: (prev) => ({ ...prev, id: id ?? undefined, create: undefined }),
			replace: true,
		});
	};

	const {
		data: workOrdersData,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(
		workOrdersInfiniteQueryOptions(orgId, {
			size: 20,
			q: debouncedSearch || undefined,
			status: searchParams.status,
			priority: searchParams.priority,
			planned_start_from: searchParams.planned_start_from,
			planned_start_to: searchParams.planned_start_to,
		}),
	);

	const workOrders =
		workOrdersData?.pages.flatMap((page) => page.items ?? []).filter(Boolean) ??
		[];

	return (
		<PanelLayout className="flex-1 min-h-0">
			<PanelList>
				<div className="p-3 border-b border-border shrink-0 flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground">
							{m.wo_count({ count: workOrders.length })}
						</span>
						<Button
							size="icon-sm"
							onClick={() =>
								navigate({
									search: (prev) => ({
										...prev,
										id: undefined,
										create: true,
									}),
									replace: true,
								})
							}
						>
							<PlusIcon weight="bold" />
						</Button>
					</div>
					<InputGroup>
						<InputGroupAddon align="inline-start">
							<MagnifyingGlassIcon className="size-4" weight="duotone" />
						</InputGroupAddon>
						<InputGroupInput
							type="search"
							placeholder={m.wo_search_placeholder()}
							value={search}
							onChange={(e) =>
								navigate({
									search: (prev) => ({
										...prev,
										q: e.target.value || undefined,
									}),
								})
							}
						/>
					</InputGroup>

					<div className="flex flex-wrap gap-1.5">
						<Popover>
							<FilterTrigger
								icon={FunnelIcon}
								label={m.wo_filter_status()}
								count={searchParams.status ? 1 : 0}
								selectedLabel={
									searchParams.status
										? getStatusLabel(searchParams.status)
										: undefined
								}
								onClear={() =>
									navigate({
										search: (prev) => ({ ...prev, status: undefined }),
										replace: true,
									})
								}
							/>
							<PopoverContent align="start" className="w-44 p-1 gap-0">
								{ALL_STATUSES.map((status) => {
									const config = STATUS_CONFIG[status];
									const StatusIcon = config.icon;
									return (
										<button
											key={status}
											type="button"
											onClick={() =>
												navigate({
													search: (prev) => ({ ...prev, status }),
													replace: true,
												})
											}
											className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-accent text-left w-full"
										>
											<CheckIcon
												className={`size-3.5 ${searchParams.status === status ? "opacity-100" : "opacity-0"}`}
												weight="bold"
											/>
											<StatusIcon
												className={`size-3.5 ${config.color}`}
												weight="duotone"
											/>
											{getStatusLabel(status)}
										</button>
									);
								})}
							</PopoverContent>
						</Popover>

						<Popover>
							<FilterTrigger
								icon={FunnelIcon}
								label={m.wo_filter_priority()}
								count={searchParams.priority ? 1 : 0}
								selectedLabel={
									searchParams.priority
										? getPriorityLabel(searchParams.priority)
										: undefined
								}
								onClear={() =>
									navigate({
										search: (prev) => ({ ...prev, priority: undefined }),
										replace: true,
									})
								}
							/>
							<PopoverContent align="start" className="w-40 p-1 gap-0">
								{ALL_PRIORITIES.map((priority) => {
									const config = PRIORITY_CONFIG[priority];
									return (
										<button
											key={priority}
											type="button"
											onClick={() =>
												navigate({
													search: (prev) => ({ ...prev, priority }),
													replace: true,
												})
											}
											className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-accent text-left w-full"
										>
											<CheckIcon
												className={`size-3.5 ${searchParams.priority === priority ? "opacity-100" : "opacity-0"}`}
												weight="bold"
											/>
											<span
												className={`size-2.5 rounded-full ${config.color}`}
											/>
											{getPriorityLabel(priority)}
										</button>
									);
								})}
							</PopoverContent>
						</Popover>

						<Popover>
							<FilterTrigger
								icon={CalendarIcon}
								label={m.wo_filter_date()}
								count={searchParams.planned_start_from ? 1 : 0}
								selectedLabel={
									searchParams.planned_start_from
										? searchParams.planned_start_to
											? `${format(new Date(`${searchParams.planned_start_from}T00:00:00`), "MMM d")} - ${format(new Date(`${searchParams.planned_start_to}T00:00:00`), "MMM d")}`
											: format(
													new Date(
														`${searchParams.planned_start_from}T00:00:00`,
													),
													"MMM d",
												)
										: undefined
								}
								onClear={() =>
									navigate({
										search: (prev) => ({
											...prev,
											planned_start_from: undefined,
											planned_start_to: undefined,
										}),
										replace: true,
									})
								}
							/>
							<PopoverContent align="start" className="w-auto p-0">
								<Calendar
									mode="range"
									disabled={maxRangeMatcher(
										searchParams.planned_start_from
											? new Date(`${searchParams.planned_start_from}T00:00:00`)
											: undefined,
										searchParams.planned_start_to
											? new Date(`${searchParams.planned_start_to}T00:00:00`)
											: undefined,
									)}
									selected={
										searchParams.planned_start_from
											? {
													from: new Date(
														`${searchParams.planned_start_from}T00:00:00`,
													),
													to: searchParams.planned_start_to
														? new Date(
																`${searchParams.planned_start_to}T00:00:00`,
															)
														: undefined,
												}
											: undefined
									}
									onSelect={(range) =>
										navigate({
											search: (prev) => ({
												...prev,
												planned_start_from: range?.from
													? format(range.from, "yyyy-MM-dd")
													: undefined,
												planned_start_to: range?.to
													? format(range.to, "yyyy-MM-dd")
													: undefined,
											}),
											replace: true,
										})
									}
								/>
							</PopoverContent>
						</Popover>
					</div>
				</div>

				<VirtualPanelList
					items={workOrders}
					isLoading={isLoading}
					hasNextPage={hasNextPage ?? false}
					isFetchingNextPage={isFetchingNextPage}
					fetchNextPage={fetchNextPage}
					getItemKey={(workOrder) => workOrder.id}
					estimateSize={56}
					emptyState={
						<div className="flex items-center justify-center h-full p-6">
							<div className="text-center text-muted-foreground">
								<ClipboardTextIcon
									className="size-8 mx-auto mb-2 opacity-50"
									weight="duotone"
								/>
								<p className="text-sm">{m.wo_empty_title()}</p>
							</div>
						</div>
					}
					renderItem={(workOrder) => (
						<WorkOrderListItem
							workOrder={workOrder}
							isSelected={selectedWorkOrderId === workOrder.id}
							onClick={() => setSelectedWorkOrderId(workOrder.id)}
						/>
					)}
				/>
			</PanelList>

			{isCreating ? (
				<WorkOrderCreatePanel
					orgId={orgId}
					onCreated={(id) => setSelectedWorkOrderId(id)}
					onCancel={() =>
						navigate({
							search: (prev) => ({ ...prev, create: undefined }),
							replace: true,
						})
					}
				/>
			) : selectedWorkOrderId ? (
				<WorkOrderDetailPanel
					key={selectedWorkOrderId}
					workOrderId={selectedWorkOrderId}
					orgId={orgId}
					activeTab={searchParams.tab ?? "overview"}
					onTabChange={(tab) =>
						navigate({
							search: (prev) => ({
								...prev,
								tab: tab === "overview" ? undefined : tab,
							}),
							replace: true,
						})
					}
				/>
			) : (
				<PanelEmpty>
					<ClipboardTextIcon
						className="size-12 text-muted-foreground/50"
						weight="duotone"
					/>
					<p className="text-muted-foreground">{m.wo_empty_select()}</p>
				</PanelEmpty>
			)}
		</PanelLayout>
	);
}
