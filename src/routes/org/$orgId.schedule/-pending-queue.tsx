import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import { FunnelIcon } from "@phosphor-icons/react/dist/csr/Funnel";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { TrayIcon } from "@phosphor-icons/react/dist/csr/Tray";
import { FilterTrigger } from "@/components/ui/filter-trigger";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Popover, PopoverContent } from "@/components/ui/popover";
import * as m from "@/paraglide/messages";
import type { MemberResponse } from "@/server/domains/organizations/schema";
import type { WorkOrderResponse } from "@/server/domains/workorders/schema";
import { PendingCard, PendingCardView } from "./-pending-card";
import {
	getQueueAssignmentLabel,
	getStatusLabel,
	QUEUE_ASSIGNMENT_OPTIONS,
	type QueueAssignment,
	STATUS_CONFIG,
	WORK_ORDER_STATUSES,
	type WorkOrderStatus,
} from "./-types";

interface PendingQueueProps {
	orgId: string;
	workOrders: WorkOrderResponse[];
	members: MemberResponse[];
	query: string;
	assignment: QueueAssignment | undefined;
	status: WorkOrderStatus | undefined;
	onAssignment: (value: QueueAssignment | undefined) => void;
	onStatus: (value: WorkOrderStatus | undefined) => void;
	onQuery: (value: string) => void;
	onLocate: (woId: number) => void;
	onAssign: (woId: number, memberId: number) => void;
}

export function PendingQueue({
	orgId,
	workOrders,
	members,
	query,
	assignment,
	status,
	onAssignment,
	onStatus,
	onQuery,
	onLocate,
	onAssign,
}: PendingQueueProps) {
	return (
		<div className="flex w-80 shrink-0 flex-col border-l h-full min-h-0 bg-card">
			<div className="p-3 border-b shrink-0">
				<div className="flex items-center gap-1.5 mb-2 flex-wrap">
					<Popover>
						<FilterTrigger
							icon={FunnelIcon}
							label={getQueueAssignmentLabel(assignment)}
							count={assignment ? 1 : 0}
							selectedLabel={getQueueAssignmentLabel(assignment)}
						/>
						<PopoverContent align="start" className="w-44 p-1 gap-0">
							{QUEUE_ASSIGNMENT_OPTIONS.map((value) => (
								<button
									key={value ?? "all"}
									type="button"
									onClick={() => onAssignment(value)}
									className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-accent text-left w-full"
								>
									<CheckIcon
										className={`size-3.5 ${assignment === value ? "opacity-100" : "opacity-0"}`}
										weight="bold"
									/>
									{getQueueAssignmentLabel(value)}
								</button>
							))}
						</PopoverContent>
					</Popover>

					<Popover>
						<FilterTrigger
							icon={FunnelIcon}
							label={m.wo_filter_status()}
							count={status ? 1 : 0}
							selectedLabel={status ? getStatusLabel(status) : undefined}
							onClear={() => onStatus(undefined)}
						/>
						<PopoverContent align="start" className="w-44 p-1 gap-0">
							{WORK_ORDER_STATUSES.map((value) => {
								const config = STATUS_CONFIG[value];
								const StatusIcon = config.icon;
								return (
									<button
										key={value}
										type="button"
										onClick={() => onStatus(value)}
										className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-accent text-left w-full"
									>
										<CheckIcon
											className={`size-3.5 ${status === value ? "opacity-100" : "opacity-0"}`}
											weight="bold"
										/>
										<StatusIcon
											className={`size-3.5 ${config.color}`}
											weight="duotone"
										/>
										{getStatusLabel(value)}
									</button>
								);
							})}
						</PopoverContent>
					</Popover>

					<span className="text-xs text-muted-foreground ml-auto tabular-nums">
						{workOrders.length}
					</span>
				</div>
				<InputGroup className="h-8">
					<InputGroupAddon align="inline-start">
						<MagnifyingGlassIcon className="size-3.5" />
					</InputGroupAddon>
					<InputGroupInput
						type="search"
						placeholder={m.schedule_queue_search()}
						value={query}
						onChange={(e) => onQuery(e.target.value)}
						className="text-xs"
					/>
				</InputGroup>
			</div>

			<div className="flex-1 overflow-y-auto p-3 space-y-2">
				{workOrders.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
						<TrayIcon className="size-8 mb-2 opacity-50" weight="duotone" />
						<p className="text-sm">{m.schedule_queue_empty()}</p>
					</div>
				) : (
					workOrders.map((wo) =>
						wo.assignees.length === 0 ? (
							<PendingCard
								key={wo.id}
								orgId={orgId}
								workOrder={wo}
								members={members}
								onLocate={() => onLocate(wo.id)}
								onAssign={(memberId) => onAssign(wo.id, memberId)}
							/>
						) : (
							<PendingCardView
								key={wo.id}
								orgId={orgId}
								workOrder={wo}
								showStatus
								onLocate={() => onLocate(wo.id)}
							/>
						),
					)
				)}
			</div>
		</div>
	);
}
