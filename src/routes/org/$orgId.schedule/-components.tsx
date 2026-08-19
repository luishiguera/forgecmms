import { ClipboardTextIcon } from "@phosphor-icons/react/dist/csr/ClipboardText";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/csr/UsersThree";
import * as m from "@/paraglide/messages";
import type { LayerKey } from "./-types";

const LAYER_ROWS: {
	key: LayerKey;
	getLabel: () => string;
	icon: typeof ClipboardTextIcon;
}[] = [
	{
		key: "workOrders",
		getLabel: () => m.schedule_layer_work_orders(),
		icon: ClipboardTextIcon,
	},
	{
		key: "members",
		getLabel: () => m.schedule_layer_members(),
		icon: UsersThreeIcon,
	},
];

interface MapFiltersProps {
	layers: Record<LayerKey, boolean>;
	onToggleLayer: (key: LayerKey, value: boolean) => void;
}

export function MapFilters({ layers, onToggleLayer }: MapFiltersProps) {
	return (
		<div className="rounded-lg border bg-card/95 backdrop-blur-sm p-1 flex items-center gap-1">
			{LAYER_ROWS.map((row) => {
				const Icon = row.icon;
				const active = layers[row.key];
				return (
					<button
						key={row.key}
						type="button"
						onClick={() => onToggleLayer(row.key, !active)}
						className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
							active
								? "bg-secondary text-secondary-foreground"
								: "text-muted-foreground/60 hover:bg-accent"
						}`}
					>
						<Icon className="size-4" weight="duotone" />
						{row.getLabel()}
					</button>
				);
			})}
		</div>
	);
}
