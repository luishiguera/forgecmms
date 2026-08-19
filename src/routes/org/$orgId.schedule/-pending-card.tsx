import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVerticalIcon } from "@phosphor-icons/react/dist/csr/DotsSixVertical";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin";
import { NavigationArrowIcon } from "@phosphor-icons/react/dist/csr/NavigationArrow";
import { UserPlusIcon } from "@phosphor-icons/react/dist/csr/UserPlus";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { buildOrgEntityDetailLink } from "@/lib/org-entity-detail-links";
import * as m from "@/paraglide/messages";
import type { MemberResponse } from "@/server/domains/organizations/schema";
import type { WorkOrderResponse } from "@/server/domains/workorders/schema";
import {
	formatAge,
	getPriorityLabel,
	getStatusLabel,
	PRIORITY_CONFIG,
	STATUS_CONFIG,
} from "./-types";

function initials(name: string): string {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.slice(0, 2);
}

interface AssignMenuProps {
	members: MemberResponse[];
	onAssign: (memberId: number) => void;
}

function AssignMenu({ members, onAssign }: AssignMenuProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const filtered = query
		? members.filter((m) =>
				m.full_name.toLowerCase().includes(query.toLowerCase()),
			)
		: members;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button variant="outline" size="sm" className="h-7 text-xs">
						<UserPlusIcon className="size-3.5 mr-1" weight="duotone" />
						{m.schedule_assign()}
					</Button>
				}
			/>
			<PopoverContent align="start" className="w-56 p-1.5">
				<InputGroup className="h-8 mb-1.5">
					<InputGroupAddon align="inline-start">
						<MagnifyingGlassIcon className="size-3.5" />
					</InputGroupAddon>
					<InputGroupInput
						type="search"
						placeholder={m.schedule_search_member()}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="text-xs"
					/>
				</InputGroup>
				<div className="max-h-56 overflow-y-auto">
					{filtered.map((member) => (
						<button
							key={member.user_id}
							type="button"
							onClick={() => {
								onAssign(member.user_id);
								setOpen(false);
							}}
							className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent text-left w-full"
						>
							<Avatar size="sm" className="text-[10px]">
								{member.photo_url && (
									<AvatarImage src={member.photo_url} alt={member.full_name} />
								)}
								<AvatarFallback>{initials(member.full_name)}</AvatarFallback>
							</Avatar>
							<span className="truncate">{member.full_name}</span>
						</button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}

interface PendingCardViewProps {
	workOrder: WorkOrderResponse;
	orgId?: string;
	dragging?: boolean;
	overlay?: boolean;
	showStatus?: boolean;
	handle?: React.ReactNode;
	members?: MemberResponse[];
	onLocate?: () => void;
	onAssign?: (memberId: number) => void;
}

export function PendingCardView({
	workOrder,
	orgId,
	dragging,
	overlay,
	showStatus,
	handle,
	members,
	onLocate,
	onAssign,
}: PendingCardViewProps) {
	const locationName = workOrder.location?.name ?? null;
	const priorityColor = PRIORITY_CONFIG[workOrder.priority].color;
	const statusConfig = STATUS_CONFIG[workOrder.status];
	const StatusIcon = statusConfig.icon;

	return (
		<div
			className={`rounded-lg border bg-card p-3 ${overlay ? "ring-2 ring-primary w-72" : ""} ${dragging ? "opacity-40" : ""}`}
		>
			<div className="flex items-center gap-2">
				{showStatus && StatusIcon ? (
					<StatusIcon
						className={`size-4 shrink-0 ${statusConfig.color}`}
						weight="duotone"
					/>
				) : (
					<span className={`size-2 rounded-full shrink-0 ${priorityColor}`} />
				)}
				<span className="text-[11px] font-mono text-muted-foreground">
					#{workOrder.id}
				</span>
				<span className="text-[11px] text-muted-foreground">
					{showStatus
						? getStatusLabel(workOrder.status)
						: getPriorityLabel(workOrder.priority)}
				</span>
				<span className="ml-auto text-[11px] text-muted-foreground">
					{formatAge(workOrder.created_at)}
				</span>
				{handle}
			</div>

			{orgId && !overlay ? (
				<a
					{...buildOrgEntityDetailLink(orgId, "work-orders", workOrder.id)}
					className="block text-sm font-medium mt-1.5 leading-snug line-clamp-2 hover:underline"
				>
					{workOrder.title}
				</a>
			) : (
				<p className="text-sm font-medium mt-1.5 leading-snug line-clamp-2">
					{workOrder.title}
				</p>
			)}

			<div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
				<MapPinIcon className="size-3.5 shrink-0" weight="duotone" />
				<span className="truncate">
					{locationName ?? m.schedule_no_location()}
				</span>
			</div>

			{!overlay && (
				<div className="flex items-center gap-1.5 mt-2.5">
					{members && onAssign && (
						<AssignMenu members={members} onAssign={onAssign} />
					)}
					{locationName && onLocate && (
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-xs ml-auto"
							onClick={onLocate}
						>
							<NavigationArrowIcon className="size-3.5 mr-1" weight="duotone" />
							{m.schedule_locate()}
						</Button>
					)}
				</div>
			)}
		</div>
	);
}

interface PendingCardProps {
	workOrder: WorkOrderResponse;
	orgId: string;
	members: MemberResponse[];
	onLocate: () => void;
	onAssign: (memberId: number) => void;
}

export function PendingCard({
	workOrder,
	orgId,
	members,
	onLocate,
	onAssign,
}: PendingCardProps) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({ id: `queue-${workOrder.id}` });

	const style = transform
		? { transform: CSS.Translate.toString(transform) }
		: undefined;

	return (
		<div ref={setNodeRef} style={style}>
			<PendingCardView
				workOrder={workOrder}
				orgId={orgId}
				dragging={isDragging}
				members={members}
				onLocate={onLocate}
				onAssign={onAssign}
				handle={
					<button
						type="button"
						className="text-muted-foreground/60 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
						{...attributes}
						{...listeners}
					>
						<DotsSixVerticalIcon className="size-4" weight="bold" />
					</button>
				}
			/>
		</div>
	);
}

export function PendingCardOverlay({
	workOrder,
}: {
	workOrder: WorkOrderResponse;
}) {
	return <PendingCardView workOrder={workOrder} overlay />;
}
