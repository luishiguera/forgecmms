import { BuildingsIcon } from "@phosphor-icons/react/dist/csr/Buildings";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { BusinessTypeBadges } from "@/components/shared/business-type-badges";
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
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import * as m from "@/paraglide/messages";
import type { BaseFieldProps, GetItemDetailLink } from "./types";

interface BusinessItem {
	id: number;
	name: string;
	type?: string;
	image_url?: string | null;
}

interface BusinessSelectFieldProps extends BaseFieldProps {
	name?: string;
	label?: string;
	placeholder?: string;
	businesses: BusinessItem[];
	onSearch?: (query: string) => void;
	isSearching?: boolean;
	error?: string;
	getItemDetailLink?: GetItemDetailLink;
}

export function BusinessSelectField({
	form,
	name = "business_id",
	label,
	placeholder,
	businesses,
	onSearch,
	isSearching,
	error,
	onFieldChange,
	status,
	getItemDetailLink,
}: BusinessSelectFieldProps) {
	const resolvedLabel = label ?? m.sidebar_businesses();
	const resolvedPlaceholder = placeholder ?? m.biz_search_placeholder();

	return (
		<form.Field name={name}>
			{(field: {
				state: { value: number | null };
				handleChange: (v: number | null) => void;
			}) => {
				const selectedBusiness = businesses.find(
					(b) => b.id === field.state.value,
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
						{!selectedBusiness && (
							<Combobox
								value={null}
								onValueChange={(business: BusinessItem | null) => {
									if (business) {
										handleChange(business.id);
									}
								}}
								items={businesses}
								itemToStringLabel={(business: BusinessItem) => business.name}
							>
								<ComboboxInput
									placeholder={resolvedPlaceholder}
									onInput={(e) => onSearch?.(e.currentTarget.value)}
								/>
								<ComboboxContent>
									<ComboboxList>
										{(business: BusinessItem) => (
											<ComboboxItem
												key={business.id}
												value={business}
												className="flex items-center gap-3 py-2"
											>
												<div className="shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center overflow-hidden">
													{business.image_url ? (
														<img
															src={business.image_url}
															alt=""
															className="size-full object-cover"
														/>
													) : (
														<BuildingsIcon className="w-4 h-4 text-muted-foreground" />
													)}
												</div>
												<div className="flex-1 min-w-0">
													<div className="font-medium truncate">
														{business.name}
													</div>
													{business.type && (
														<div className="flex flex-wrap items-center gap-1 mt-0.5">
															<BusinessTypeBadges type={business.type} />
														</div>
													)}
												</div>
											</ComboboxItem>
										)}
									</ComboboxList>
									<ComboboxEmpty>
										{isSearching ? m.shared_searching() : m.biz_empty_title()}
									</ComboboxEmpty>
								</ComboboxContent>
							</Combobox>
						)}
						{selectedBusiness && (
							<div className="mt-2">
								<Item variant="outline">
									<ItemMedia variant="image">
										{selectedBusiness.image_url ? (
											<img
												src={selectedBusiness.image_url}
												alt=""
												className="size-full object-cover rounded-md"
											/>
										) : (
											<BuildingsIcon className="w-5 h-5 text-muted-foreground" />
										)}
									</ItemMedia>
									<ItemContent>
										<ItemTitle
											link={getItemDetailLink?.(selectedBusiness.id) ?? null}
											onLinkClick={(e) => e.stopPropagation()}
										>
											{selectedBusiness.name}
										</ItemTitle>
										{selectedBusiness.type && (
											<div className="flex flex-wrap items-center gap-1 mt-0.5">
												<BusinessTypeBadges type={selectedBusiness.type} />
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
