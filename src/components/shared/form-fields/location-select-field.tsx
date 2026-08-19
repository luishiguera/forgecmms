import { BuildingsIcon } from "@phosphor-icons/react/dist/csr/Buildings";
import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin";
import { PhoneIcon } from "@phosphor-icons/react/dist/csr/Phone";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
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
	business?: {
		name?: string;
		phones?: Array<{ number?: string }>;
	} | null;
}

interface LocationSelectFieldProps extends BaseFieldProps {
	name?: string;
	label?: string;
	placeholder?: string;
	locations: LocationItem[];
	onSearch?: (query: string) => void;
	isSearching?: boolean;
	error?: string;
	getItemDetailLink?: GetItemDetailLink;
	showContact?: boolean;
}

export function LocationSelectField({
	form,
	name = "location_id",
	label,
	placeholder,
	locations,
	onSearch,
	isSearching,
	error,
	onFieldChange,
	status,
	getItemDetailLink,
	showContact = false,
}: LocationSelectFieldProps) {
	const resolvedLabel = label ?? m.shared_field_location();
	const resolvedPlaceholder = placeholder ?? m.shared_field_search_locations();

	return (
		<form.Field name={name}>
			{(field: {
				state: { value: number | null };
				handleChange: (v: number | null) => void;
			}) => {
				const selectedLocation = locations.find(
					(l) => l.id === field.state.value,
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
						{!selectedLocation && (
							<Combobox
								value={null}
								onValueChange={(location: LocationItem | null) => {
									if (location) {
										handleChange(location.id);
									}
								}}
								items={locations}
								itemToStringLabel={(location: LocationItem) => location.name}
							>
								<ComboboxInput
									placeholder={resolvedPlaceholder}
									onInput={(e) => onSearch?.(e.currentTarget.value)}
								/>
								<ComboboxContent>
									<ComboboxList>
										{(location: LocationItem) => (
											<ComboboxItem
												key={location.id}
												value={location}
												className="flex items-center gap-3 py-2"
											>
												<div className="shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center overflow-hidden">
													{location.image_url ? (
														<img
															src={location.image_url}
															alt=""
															className="w-full h-full object-cover"
														/>
													) : (
														<MapPinIcon className="w-4 h-4 text-muted-foreground" />
													)}
												</div>
												<div className="flex-1 min-w-0">
													<div className="font-medium truncate">
														{location.name}
													</div>
													{location.address && (
														<div className="text-xs text-muted-foreground truncate">
															{location.address}
														</div>
													)}
												</div>
											</ComboboxItem>
										)}
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
										{showContact && selectedLocation.business && (
											<div className="mt-1 space-y-0.5">
												{selectedLocation.business.name && (
													<div className="flex items-center gap-1.5">
														<BuildingsIcon className="size-3 text-muted-foreground shrink-0" />
														<span className="text-xs text-muted-foreground">
															{selectedLocation.business.name}
														</span>
													</div>
												)}
												{selectedLocation.business.phones
													?.filter((p) => p.number)
													.map((phone, idx) => (
														<div
															key={idx}
															className="flex items-center gap-1.5"
														>
															<PhoneIcon className="size-3 text-muted-foreground shrink-0" />
															<span className="text-xs text-primary">
																{phone.number}
															</span>
														</div>
													))}
											</div>
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
