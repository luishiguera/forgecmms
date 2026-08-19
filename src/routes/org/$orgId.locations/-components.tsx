import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin";
import { Badge } from "@/components/ui/badge";
import {
	PanelListItem,
	PanelListItemAvatar,
	PanelListItemContent,
	PanelListItemSubtitle,
	PanelListItemTitle,
} from "@/components/ui/panel-layout";
import * as m from "@/paraglide/messages";
import type { LocationResponse } from "@/server/domains/locations/schema";

interface LocationListItemProps {
	location: LocationResponse;
	isSelected: boolean;
	onClick: () => void;
}

export function LocationListItem({
	location,
	isSelected,
	onClick,
}: LocationListItemProps) {
	return (
		<PanelListItem isSelected={isSelected} onClick={onClick}>
			<PanelListItemAvatar>
				{location.image_url ? (
					<img
						src={location.image_url}
						alt=""
						className="size-full object-cover rounded-full"
					/>
				) : (
					<MapPinIcon className="size-5" weight="duotone" />
				)}
			</PanelListItemAvatar>

			<PanelListItemContent>
				<PanelListItemTitle>{location.name}</PanelListItemTitle>
				<PanelListItemSubtitle>
					{location.address || m.loc_no_address()}
				</PanelListItemSubtitle>
				{location.tags?.length > 0 && (
					<div className="flex items-center gap-1 mt-0.5">
						{location.tags.slice(0, 2).map((tag) => (
							<Badge key={tag.id}>{tag.name}</Badge>
						))}
						{location.tags.length > 2 && (
							<Badge>+{location.tags.length - 2}</Badge>
						)}
					</div>
				)}
			</PanelListItemContent>
		</PanelListItem>
	);
}
