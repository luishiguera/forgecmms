import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { CircleIcon } from "@phosphor-icons/react/dist/csr/Circle";
import { ClockIcon } from "@phosphor-icons/react/dist/csr/Clock";
import { HardDriveIcon } from "@phosphor-icons/react/dist/csr/HardDrive";
import { MinusCircleIcon } from "@phosphor-icons/react/dist/csr/MinusCircle";
import { StarIcon } from "@phosphor-icons/react/dist/csr/Star";
import { WarningIcon } from "@phosphor-icons/react/dist/csr/Warning";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { Badge } from "@/components/ui/badge";
import {
	PanelListItem,
	PanelListItemAvatar,
	PanelListItemContent,
	PanelListItemSubtitle,
	PanelListItemTitle,
} from "@/components/ui/panel-layout";
import * as m from "@/paraglide/messages";
import type { AssetResponse } from "@/server/domains/assets/schema";

export function getStatusIcon(status: string) {
	switch (status) {
		case "operational":
			return (
				<CheckCircleIcon className="size-4 text-green-600" weight="fill" />
			);
		case "needs_maintenance":
			return (
				<WarningCircleIcon className="size-4 text-yellow-600" weight="fill" />
			);
		case "pending":
			return <ClockIcon className="size-4 text-blue-600" weight="fill" />;
		case "retired":
			return (
				<MinusCircleIcon
					className="size-4 text-muted-foreground"
					weight="fill"
				/>
			);
		default:
			return null;
	}
}

export function getCriticalityIcon(criticality: string) {
	switch (criticality) {
		case "critical":
			return <WarningIcon className="size-4 text-red-600" weight="fill" />;
		case "important":
			return <StarIcon className="size-4 text-yellow-600" weight="fill" />;
		case "normal":
			return (
				<CircleIcon className="size-4 text-muted-foreground" weight="fill" />
			);
		default:
			return null;
	}
}

interface AssetListItemProps {
	asset: AssetResponse;
	isSelected: boolean;
	onClick: () => void;
}

export function AssetListItem({
	asset,
	isSelected,
	onClick,
}: AssetListItemProps) {
	const needsMaintenance = asset.status === "needs_maintenance";

	return (
		<PanelListItem isSelected={isSelected} onClick={onClick}>
			<PanelListItemAvatar
				className={needsMaintenance ? "bg-yellow-500/10 text-yellow-600" : ""}
			>
				{asset.image_url ? (
					<img
						src={asset.image_url}
						alt=""
						className="size-full object-cover rounded-full"
					/>
				) : (
					<HardDriveIcon className="size-5" weight="duotone" />
				)}
			</PanelListItemAvatar>

			<PanelListItemContent>
				<PanelListItemTitle>{asset.name}</PanelListItemTitle>
				<PanelListItemSubtitle>
					{asset.serial_number ? (
						<span>{asset.serial_number}</span>
					) : asset.model ? (
						<span>{asset.model}</span>
					) : (
						<span className="text-muted-foreground/50">
							{m.assets_no_serial_model()}
						</span>
					)}
				</PanelListItemSubtitle>
				{asset.tags?.length > 0 && (
					<div className="flex items-center gap-1 mt-0.5">
						{asset.tags.slice(0, 2).map((tag) => (
							<Badge key={tag.id}>{tag.name}</Badge>
						))}
						{asset.tags.length > 2 && <Badge>+{asset.tags.length - 2}</Badge>}
					</div>
				)}
			</PanelListItemContent>
		</PanelListItem>
	);
}
