import { CubeIcon } from "@phosphor-icons/react/dist/csr/Cube";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldLabel } from "@/components/ui/field";
import { FieldStatusIndicator } from "@/components/ui/field-status-indicator";
import { Input } from "@/components/ui/input";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import type { FieldStatus } from "@/hooks/use-auto-save";
import { useDebounce } from "@/hooks/use-debounce";
import { buildOrgEntityDetailUrl } from "@/lib/org-entity-detail-links";
import { partsQueryOptions } from "@/lib/queries/parts";
import * as m from "@/paraglide/messages";
import type { WorkOrderPartItemResponse } from "@/server/domains/workorders/schema";

export type AddablePart = {
	id: number;
	name: string;
	sku?: string;
	image_url?: string;
};

interface WorkOrderPartsFieldProps {
	orgId: string;
	existingParts: WorkOrderPartItemResponse[];
	onAddPart: (part: AddablePart) => void;
	onRemovePart: (partId: number) => void;
	onChangePlanned: (partId: number, plannedQuantity: number) => void;
	onChangeUsed?: (partId: number, usedQuantity: number) => void;
	status?: FieldStatus;
}

export function WorkOrderPartsField({
	orgId,
	existingParts,
	onAddPart,
	onRemovePart,
	onChangePlanned,
	onChangeUsed,
	status,
}: WorkOrderPartsFieldProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearchQuery = useDebounce(searchQuery, 300);

	const stockMapRef = useRef(new Map<number, number>());

	const { data: partsData, isFetching } = useQuery(
		partsQueryOptions(orgId, {
			page: 1,
			size: 20,
			q: debouncedSearchQuery || undefined,
		}),
	);

	const combinedParts = useMemo(() => {
		const searchResults = partsData?.items ?? [];

		for (const p of searchResults) {
			stockMapRef.current.set(p.id, p.quantity);
		}

		const existingIds = new Set(existingParts.map((p) => p.id));
		const newFromSearch = searchResults.filter((p) => !existingIds.has(p.id));
		return [
			...existingParts.map((p) => ({
				id: p.id,
				name: p.name,
				sku: p.sku,
				image_url: p.image_url,
				assigned_quantity: p.planned_quantity,
				stock_quantity: stockMapRef.current.get(p.id),
			})),
			...newFromSearch.map((p) => ({
				id: p.id,
				name: p.name,
				sku: p.sku ?? undefined,
				image_url: p.image_url ?? undefined,
				assigned_quantity: undefined,
				stock_quantity: p.quantity,
			})),
		];
	}, [existingParts, partsData?.items]);

	const partMap = useMemo(
		() => new Map(combinedParts.map((p) => [p.id, p])),
		[combinedParts],
	);

	const selectedIds = existingParts.map((p) => p.id);
	const availableParts = combinedParts.filter(
		(p) => !selectedIds.includes(p.id),
	);

	const handleAddPart = (partId: number) => {
		const added = combinedParts.find((p) => p.id === partId);
		if (added) {
			onAddPart({
				id: added.id,
				name: added.name,
				sku: added.sku ?? undefined,
				image_url: added.image_url ?? undefined,
			});
		}
	};

	const handleRemovePart = (partId: number) => {
		onRemovePart(partId);
	};

	const handlePlannedChange = (partId: number, plannedQuantity: number) => {
		onChangePlanned(partId, plannedQuantity);
	};

	return (
		<Field>
			<FieldLabel className="flex items-center gap-1.5">
				{m.wo_parts_label()}
				{status && <FieldStatusIndicator status={status} />}
			</FieldLabel>
			<Combobox
				value={null}
				onValueChange={(value) => {
					const part = partMap.get(Number(value));
					if (part && !selectedIds.includes(part.id)) {
						handleAddPart(part.id);
					}
				}}
				items={availableParts.map((p) => p.id.toString())}
				filter={null}
			>
				<ComboboxInput
					placeholder={m.wo_parts_search_placeholder()}
					onInput={(e) => setSearchQuery(e.currentTarget.value)}
				/>
				<ComboboxContent>
					<ComboboxList>
						{(item) => {
							const p = partMap.get(Number(item));
							if (!p) return null;
							return (
								<ComboboxItem
									key={item}
									value={item}
									className="flex items-center gap-3 py-2"
								>
									<div className="shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center overflow-hidden">
										{p.image_url ? (
											<img
												src={p.image_url}
												alt=""
												className="w-full h-full object-cover"
											/>
										) : (
											<CubeIcon className="w-4 h-4 text-muted-foreground" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="font-medium truncate">{p.name}</div>
										<div className="text-xs text-muted-foreground truncate">
											{p.sku && <span>{p.sku}</span>}
											{p.sku && p.stock_quantity !== undefined && <> · </>}
											{p.stock_quantity !== undefined && (
												<span>
													{m.wo_parts_in_stock({ count: p.stock_quantity })}
												</span>
											)}
										</div>
									</div>
								</ComboboxItem>
							);
						}}
					</ComboboxList>
					<ComboboxEmpty>
						{isFetching ? m.wo_parts_searching() : m.wo_parts_not_found()}
					</ComboboxEmpty>
				</ComboboxContent>
			</Combobox>
			{existingParts.length > 0 && (
				<div className="space-y-2 mt-2">
					{existingParts.map((part) => {
						const stockQuantity = stockMapRef.current.get(part.id);
						return (
							<Item key={part.id} variant="outline" className="gap-2">
								<ItemMedia variant="image">
									{part.image_url ? (
										<img
											src={part.image_url}
											alt=""
											className="size-full object-cover"
										/>
									) : (
										<CubeIcon className="w-5 h-5 text-muted-foreground" />
									)}
								</ItemMedia>

								<ItemContent className="min-w-0 flex-1">
									<ItemTitle
										className="text-xs"
										link={{
											href: buildOrgEntityDetailUrl(orgId, "parts", part.id),
											target: "_blank",
											rel: "noopener noreferrer",
										}}
										onLinkClick={(e) => e.stopPropagation()}
									>
										{part.name}
									</ItemTitle>
									<ItemDescription className="text-xs">
										{part.sku && <span>{part.sku}</span>}
										{part.sku && stockQuantity !== undefined && <> · </>}
										{stockQuantity !== undefined && (
											<span>
												{m.wo_parts_in_stock({ count: stockQuantity })}
											</span>
										)}
									</ItemDescription>
								</ItemContent>

								<div className="flex items-center gap-1 shrink-0">
									<span className="text-xs text-muted-foreground">
										{m.wo_parts_planned()}
									</span>
									<Input
										type="number"
										min={1}
										value={part.planned_quantity}
										onChange={(e) =>
											handlePlannedChange(
												part.id,
												Math.max(1, Number.parseInt(e.target.value, 10) || 1),
											)
										}
										className="h-7 w-16 text-xs"
									/>
								</div>

								{onChangeUsed && (
									<div className="flex items-center gap-1 shrink-0">
										<span className="text-xs text-muted-foreground">
											{m.wo_parts_used()}
										</span>
										<Input
											type="number"
											min={0}
											value={part.used_quantity}
											onChange={(e) =>
												onChangeUsed(
													part.id,
													Math.max(0, Number.parseInt(e.target.value, 10) || 0),
												)
											}
											className="h-7 w-16 text-xs"
										/>
									</div>
								)}

								<ItemActions className="shrink-0">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="size-6 p-0"
										onClick={(e) => {
											e.stopPropagation();
											handleRemovePart(part.id);
										}}
									>
										<XIcon className="size-3" />
									</Button>
								</ItemActions>
							</Item>
						);
					})}
				</div>
			)}
		</Field>
	);
}
