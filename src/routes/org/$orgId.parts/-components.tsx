import { CubeIcon } from "@phosphor-icons/react/dist/csr/Cube";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { Badge } from "@/components/ui/badge";
import {
	PanelListItem,
	PanelListItemAvatar,
	PanelListItemContent,
	PanelListItemMeta,
	PanelListItemSubtitle,
	PanelListItemTitle,
} from "@/components/ui/panel-layout";
import * as m from "@/paraglide/messages";
import type { PartResponse } from "@/server/domains/parts/schema";
import { isLowStock } from "./-types";

interface PartListItemProps {
	part: PartResponse;
	isSelected: boolean;
	onClick: () => void;
}

export function PartListItem({ part, isSelected, onClick }: PartListItemProps) {
	const isBelow = isLowStock(part.quantity, part.min_quantity);

	return (
		<PanelListItem isSelected={isSelected} onClick={onClick}>
			<PanelListItemAvatar
				className={isBelow ? "bg-destructive/10 text-destructive" : ""}
			>
				{part.image_url ? (
					<img
						src={part.image_url}
						alt=""
						className="size-full object-cover rounded-full"
					/>
				) : (
					<CubeIcon className="size-5" weight="duotone" />
				)}
			</PanelListItemAvatar>

			<PanelListItemContent>
				<PanelListItemTitle>{part.name}</PanelListItemTitle>
				<PanelListItemSubtitle>
					{part.sku ? (
						<span>{part.sku}</span>
					) : (
						<span className="text-muted-foreground/50">{m.parts_no_sku()}</span>
					)}
				</PanelListItemSubtitle>
				{part.tags?.length > 0 && (
					<div className="flex items-center gap-1 mt-0.5">
						{part.tags.slice(0, 2).map((tag) => (
							<Badge key={tag.id}>{tag.name}</Badge>
						))}
						{part.tags.length > 2 && <Badge>+{part.tags.length - 2}</Badge>}
					</div>
				)}
			</PanelListItemContent>

			<PanelListItemMeta>
				<span
					className={`font-medium tabular-nums ${isBelow ? "text-destructive" : ""}`}
				>
					{part.quantity}
				</span>
				{isBelow && (
					<WarningCircleIcon
						className="size-3.5 text-destructive"
						weight="fill"
					/>
				)}
			</PanelListItemMeta>
		</PanelListItem>
	);
}
