import { BuildingsIcon } from "@phosphor-icons/react/dist/csr/Buildings";
import { BusinessTypeBadges } from "@/components/shared/business-type-badges";
import {
	PanelListItem,
	PanelListItemAvatar,
	PanelListItemContent,
	PanelListItemTitle,
} from "@/components/ui/panel-layout";
import type { BusinessResponse } from "@/server/domains/businesses/schema";

interface BusinessListItemProps {
	business: BusinessResponse;
	isSelected: boolean;
	onClick: () => void;
}

export function BusinessListItem({
	business,
	isSelected,
	onClick,
}: BusinessListItemProps) {
	return (
		<PanelListItem isSelected={isSelected} onClick={onClick}>
			<PanelListItemAvatar>
				{business.image_url ? (
					<img
						src={business.image_url}
						alt=""
						className="size-full object-cover rounded-full"
					/>
				) : (
					<BuildingsIcon className="size-5" weight="duotone" />
				)}
			</PanelListItemAvatar>

			<PanelListItemContent>
				<PanelListItemTitle>{business.name}</PanelListItemTitle>
				<div className="flex items-center gap-1 mt-0.5">
					<BusinessTypeBadges type={business.type} />
				</div>
			</PanelListItemContent>
		</PanelListItem>
	);
}
