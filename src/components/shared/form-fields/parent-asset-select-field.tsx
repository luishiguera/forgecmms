import { HardDriveIcon } from "@phosphor-icons/react/dist/csr/HardDrive";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { FieldStatusIndicator } from "@/components/ui/field-status-indicator";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import * as m from "@/paraglide/messages";
import type { BaseFieldProps, GetItemDetailLink } from "./types";

interface AssetItem {
	id: number;
	name: string;
	serial_number?: string | null;
	image_url?: string | null;
}

interface ParentAssetSelectFieldProps extends BaseFieldProps {
	name?: string;
	label?: string;
	placeholder?: string;
	assets: AssetItem[];
	excludeAssetId?: number;
	onSearch?: (query: string) => void;
	isSearching?: boolean;
	error?: string;
	getItemDetailLink?: GetItemDetailLink;
}

export function ParentAssetSelectField({
	form,
	name = "parent_asset_id",
	label,
	placeholder,
	assets,
	excludeAssetId,
	onSearch,
	isSearching,
	error,
	onFieldChange,
	status,
	getItemDetailLink,
}: ParentAssetSelectFieldProps) {
	const resolvedLabel = label ?? m.shared_field_parent_asset();
	const resolvedPlaceholder = placeholder ?? m.shared_field_search_assets();

	const availableAssets = useMemo(
		() =>
			excludeAssetId ? assets.filter((a) => a.id !== excludeAssetId) : assets,
		[assets, excludeAssetId],
	);

	return (
		<form.Field name={name}>
			{(field: {
				state: { value: number | null };
				handleChange: (v: number | null) => void;
			}) => {
				const selectedAsset = availableAssets.find(
					(a) => a.id === field.state.value,
				);

				const handleChange = (newId: number | null) => {
					field.handleChange(newId);
					onFieldChange?.(name);
				};

				return (
					<Field>
						<FieldLabel className="flex items-center gap-1.5">
							{resolvedLabel}
							{status && <FieldStatusIndicator status={status} />}
						</FieldLabel>
						{!selectedAsset && (
							<Combobox
								value={null}
								onValueChange={(asset: AssetItem | null) => {
									if (asset) {
										handleChange(asset.id);
									}
								}}
								items={availableAssets}
								itemToStringLabel={(asset: AssetItem) => asset.name}
							>
								<ComboboxInput
									placeholder={resolvedPlaceholder}
									onInput={(e) => onSearch?.(e.currentTarget.value)}
								/>
								<ComboboxContent>
									<ComboboxList>
										{(asset: AssetItem) => (
											<ComboboxItem
												key={asset.id}
												value={asset}
												className="flex items-center gap-3 py-2"
											>
												<div className="shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center overflow-hidden">
													{asset.image_url ? (
														<img
															src={asset.image_url}
															alt=""
															className="w-full h-full object-cover"
														/>
													) : (
														<HardDriveIcon className="w-4 h-4 text-muted-foreground" />
													)}
												</div>
												<div className="flex-1 min-w-0">
													<div className="font-medium truncate">
														{asset.name}
													</div>
													{asset.serial_number && (
														<div className="text-xs text-muted-foreground truncate">
															{asset.serial_number}
														</div>
													)}
												</div>
											</ComboboxItem>
										)}
									</ComboboxList>
									<ComboboxEmpty>
										{isSearching
											? m.shared_searching()
											: m.shared_no_assets_found()}
									</ComboboxEmpty>
								</ComboboxContent>
							</Combobox>
						)}
						{selectedAsset && (
							<div className="mt-2">
								<Item variant="outline">
									<ItemMedia variant="image">
										{selectedAsset.image_url ? (
											<img src={selectedAsset.image_url} alt="" />
										) : (
											<HardDriveIcon className="w-5 h-5 text-muted-foreground" />
										)}
									</ItemMedia>
									<ItemContent>
										<ItemTitle
											link={getItemDetailLink?.(selectedAsset.id) ?? null}
											onLinkClick={(e) => e.stopPropagation()}
										>
											{selectedAsset.name}
										</ItemTitle>
										{selectedAsset.serial_number && (
											<ItemDescription>
												{selectedAsset.serial_number}
											</ItemDescription>
										)}
									</ItemContent>
									<ItemActions>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												handleChange(null);
											}}
										>
											<XIcon className="w-4 h-4" />
										</Button>
									</ItemActions>
								</Item>
							</div>
						)}
						{error && <FieldError>{error}</FieldError>}
					</Field>
				);
			}}
		</form.Field>
	);
}
