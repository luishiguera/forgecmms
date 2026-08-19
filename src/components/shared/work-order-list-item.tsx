import { Badge } from "@/components/ui/badge";
import {
	PanelListItem,
	PanelListItemAvatar,
	PanelListItemContent,
	PanelListItemMeta,
	PanelListItemSubtitle,
	PanelListItemTitle,
} from "@/components/ui/panel-layout";
import { STATUS_CONFIG, type WorkOrderStatus } from "@/lib/work-orders/status";
import * as m from "@/paraglide/messages";
import type { WorkOrderResponse } from "@/server/domains/workorders/schema";
import { formatDate } from "@/utils/format-date";

export { STATUS_CONFIG, type WorkOrderStatus };

export const PRIORITY_CONFIG = {
	low: { color: "bg-slate-500" },
	medium: { color: "bg-sky-500" },
	high: { color: "bg-amber-500" },
	urgent: { color: "bg-red-500" },
} as const;

interface WorkOrderListItemProps {
	workOrder: WorkOrderResponse;
	isSelected: boolean;
	onClick: () => void;
}

export function WorkOrderListItem({
	workOrder,
	isSelected,
	onClick,
}: WorkOrderListItemProps) {
	const statusConfig = STATUS_CONFIG[workOrder.status];
	const priorityConfig = PRIORITY_CONFIG[workOrder.priority];
	const StatusIcon = statusConfig.icon;

	return (
		<PanelListItem isSelected={isSelected} onClick={onClick}>
			<PanelListItemAvatar className="relative">
				<StatusIcon
					className={`size-5 ${statusConfig.color}`}
					weight={"duotone"}
				/>
				<span
					className={`absolute -top-0.5 -right-0.5 size-2.5 rounded-full ${priorityConfig.color}`}
				/>
			</PanelListItemAvatar>

			<PanelListItemContent>
				<PanelListItemTitle>
					<span className="font-mono text-muted-foreground mr-1.5 text-xs">
						#{workOrder.id}
					</span>
					{workOrder.title}
				</PanelListItemTitle>
				<PanelListItemSubtitle>
					{workOrder.description
						? workOrder.description.length > 50
							? `${workOrder.description.slice(0, 50)}...`
							: workOrder.description
						: m.wo_no_description()}
				</PanelListItemSubtitle>
				{workOrder.tags?.length > 0 && (
					<div className="flex items-center gap-1 mt-0.5">
						{workOrder.tags.slice(0, 2).map((tag) => (
							<Badge key={tag.id}>{tag.name}</Badge>
						))}
						{workOrder.tags.length > 2 && (
							<Badge>+{workOrder.tags.length - 2}</Badge>
						)}
					</div>
				)}
			</PanelListItemContent>

			<PanelListItemMeta>
				{workOrder.planned_end && (
					<span className="text-xs text-muted-foreground">
						{formatDate(workOrder.planned_end, { style: "short" })}
					</span>
				)}
			</PanelListItemMeta>
		</PanelListItem>
	);
}
