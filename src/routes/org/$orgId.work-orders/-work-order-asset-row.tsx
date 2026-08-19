import { HardDriveIcon } from "@phosphor-icons/react/dist/csr/HardDrive";
import { ListChecksIcon } from "@phosphor-icons/react/dist/csr/ListChecks";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemFooter,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { buildOrgEntityDetailUrl } from "@/lib/org-entity-detail-links";
import { proceduresQueryOptions } from "@/lib/queries/procedures";
import * as m from "@/paraglide/messages";
import type { WorkOrderAssetItemResponse } from "@/server/domains/workorders/schema";

const criticalityLabels: Record<string, () => string> = {
	critical: m.assets_criticality_critical,
	important: m.assets_criticality_important,
	normal: m.assets_criticality_normal,
};

interface WorkOrderAssetRowProps {
	asset: WorkOrderAssetItemResponse;
	orgId: string;
	onRemove: () => void;
	onAddProcedure: (procedureId: number) => void;
	onRemoveProcedure: (procedureId: number) => void;
}

export function WorkOrderAssetRow({
	asset,
	orgId,
	onRemove,
	onAddProcedure,
	onRemoveProcedure,
}: WorkOrderAssetRowProps) {
	const { data: proceduresData } = useQuery(
		proceduresQueryOptions(orgId, { page: 1, size: 100 }),
	);

	const procedures = proceduresData?.items ?? [];

	const selectedProcedureIds = useMemo(
		() => new Set(asset.procedures?.map((p) => p.id) ?? []),
		[asset.procedures],
	);

	const availableProcedures = useMemo(
		() => procedures.filter((p) => !selectedProcedureIds.has(p.id)),
		[procedures, selectedProcedureIds],
	);

	const procedureMap = useMemo(
		() => new Map(availableProcedures.map((p) => [p.id.toString(), p])),
		[availableProcedures],
	);

	const descriptionParts: string[] = [];
	if (asset.serial_number) descriptionParts.push(asset.serial_number);
	if (asset.criticality && asset.criticality !== "normal") {
		descriptionParts.push(
			criticalityLabels[asset.criticality]?.() ?? asset.criticality,
		);
	}

	return (
		<Item variant="outline" className="gap-2">
			<ItemMedia variant="image">
				{asset.image_url ? (
					<img
						src={asset.image_url}
						alt=""
						className="size-full object-cover"
					/>
				) : (
					<HardDriveIcon className="w-5 h-5 text-muted-foreground" />
				)}
			</ItemMedia>
			<ItemContent className="min-w-0 flex-1">
				<ItemTitle
					className="text-xs"
					link={{
						href: buildOrgEntityDetailUrl(orgId, "assets", asset.id),
						target: "_blank",
						rel: "noopener noreferrer",
					}}
					onLinkClick={(e) => e.stopPropagation()}
				>
					{asset.name}
				</ItemTitle>
				{descriptionParts.length > 0 && (
					<ItemDescription className="text-xs">
						{descriptionParts.join(" · ")}
					</ItemDescription>
				)}
			</ItemContent>
			<ItemActions className="shrink-0">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="size-6 p-0"
					onClick={(e) => {
						e.stopPropagation();
						onRemove();
					}}
				>
					<XIcon className="size-3" />
				</Button>
			</ItemActions>

			<ItemFooter className="flex-col items-stretch gap-2">
				<Combobox
					value=""
					onValueChange={(value) => {
						if (value) {
							onAddProcedure(Number(value));
						}
					}}
					items={availableProcedures.map((p) => p.id.toString())}
					itemToStringLabel={(value: string) =>
						procedureMap.get(value)?.name ?? value
					}
					filter={(value, search) => {
						const procedure = procedureMap.get(value);
						if (!procedure) return false;
						const s = search.toLowerCase();
						return (
							procedure.name.toLowerCase().includes(s) ||
							procedure.description.toLowerCase().includes(s)
						);
					}}
				>
					<ComboboxInput
						className="h-6 text-xs w-full"
						placeholder={m.wo_add_procedure_placeholder()}
						showTrigger={false}
					/>
					<ComboboxContent>
						<ComboboxList>
							{(item) => {
								const procedure = procedureMap.get(item);
								if (!procedure) return null;
								return (
									<ComboboxItem
										key={item}
										value={item}
										className="flex items-center gap-2 py-1.5"
									>
										<ListChecksIcon className="size-3.5 text-muted-foreground shrink-0" />
										<div className="flex-1 min-w-0">
											<div className="truncate">{procedure.name}</div>
											{procedure.description && (
												<div className="text-[11px] text-muted-foreground truncate">
													{procedure.description}
												</div>
											)}
										</div>
									</ComboboxItem>
								);
							}}
						</ComboboxList>
						<ComboboxEmpty>{m.wo_no_procedures_found()}</ComboboxEmpty>
					</ComboboxContent>
				</Combobox>

				{asset.procedures && asset.procedures.length > 0 && (
					<div className="space-y-2">
						{asset.procedures.map((proc) => (
							<div key={proc.id} className="flex items-start gap-2">
								<ListChecksIcon className="size-3 text-muted-foreground shrink-0 mt-0.5" />
								<div className="flex-1 min-w-0">
									<span className="text-xs text-muted-foreground truncate block">
										{proc.name}
									</span>
									{proc.description && (
										<span className="text-[11px] text-muted-foreground/70 truncate block">
											{proc.description}
										</span>
									)}
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="size-4 p-0 shrink-0"
									onClick={(e) => {
										e.stopPropagation();
										onRemoveProcedure(proc.id);
									}}
								>
									<XIcon className="size-2.5" />
								</Button>
							</div>
						))}
					</div>
				)}
			</ItemFooter>
		</Item>
	);
}
