import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin";
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

interface LocationItem {
	id: number;
	name: string;
	address?: string | null;
	image_url?: string | null;
}

interface ParentLocationSelectFieldProps extends BaseFieldProps {
	name?: string;
	label?: string;
	placeholder?: string;
	locations: LocationItem[];
	excludeLocationId?: number;
	onSearch?: (query: string) => void;
	isSearching?: boolean;
	error?: string;
	getItemDetailLink?: GetItemDetailLink;
}

export function ParentLocationSelectField({
	form,
	name = "parent_location_id",
	label,
	placeholder,
	locations,
	excludeLocationId,
	onSearch,
	isSearching,
	error,
	onFieldChange,
	status,
	getItemDetailLink,
}: ParentLocationSelectFieldProps) {
	const resolvedLabel = label ?? m.shared_field_parent_location();
	const resolvedPlaceholder = placeholder ?? m.shared_field_search_locations();

	const availableLocations = useMemo(
		() =>
			excludeLocationId
				? locations.filter((l) => l.id !== excludeLocationId)
				: locations,
		[locations, excludeLocationId],
	);

	const locationMap = useMemo(
		() => new Map(availableLocations.map((l) => [l.id, l])),
		[availableLocations],
	);

	return (
		<form.Field name={name}>
			{(field: {
				state: { value: number | null };
				handleChange: (v: number | null) => void;
			}) => {
				const selectedLocation = field.state.value
					? locationMap.get(field.state.value)
					: null;

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
						{!selectedLocation && (
							<Combobox
								value={null}
								onValueChange={(value) => {
									const location = locationMap.get(Number(value));
									if (location) {
										handleChange(location.id);
									}
								}}
								items={availableLocations.map((l) => l.id.toString())}
							>
								<ComboboxInput
									placeholder={resolvedPlaceholder}
									onInput={(e) => onSearch?.(e.currentTarget.value)}
								/>
								<ComboboxContent>
									<ComboboxList>
										{(item) => {
											const l = locationMap.get(Number(item));
											if (!l) return null;
											return (
												<ComboboxItem
													key={item}
													value={item}
													className="flex items-center gap-3 py-2"
												>
													<div className="shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center overflow-hidden">
														{l.image_url ? (
															<img
																src={l.image_url}
																alt=""
																className="w-full h-full object-cover"
															/>
														) : (
															<MapPinIcon className="w-4 h-4 text-muted-foreground" />
														)}
													</div>
													<div className="flex-1 min-w-0">
														<div className="font-medium truncate">{l.name}</div>
														{l.address && (
															<div className="text-xs text-muted-foreground truncate">
																{l.address}
															</div>
														)}
													</div>
												</ComboboxItem>
											);
										}}
									</ComboboxList>
									<ComboboxEmpty>
										{isSearching
											? m.shared_searching()
											: m.shared_no_locations_found()}
									</ComboboxEmpty>
								</ComboboxContent>
							</Combobox>
						)}
						{selectedLocation && (
							<div className="mt-2">
								<Item variant="outline">
									<ItemMedia variant="image">
										{selectedLocation.image_url ? (
											<img src={selectedLocation.image_url} alt="" />
										) : (
											<MapPinIcon className="w-5 h-5 text-muted-foreground" />
										)}
									</ItemMedia>
									<ItemContent>
										<ItemTitle
											link={getItemDetailLink?.(selectedLocation.id) ?? null}
											onLinkClick={(e) => e.stopPropagation()}
										>
											{selectedLocation.name}
										</ItemTitle>
										{selectedLocation.address && (
											<ItemDescription truncate={false}>
												{selectedLocation.address}
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
