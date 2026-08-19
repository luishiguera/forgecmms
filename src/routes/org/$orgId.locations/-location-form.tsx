import { HardDriveIcon } from "@phosphor-icons/react/dist/csr/HardDrive";
import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useForm } from "@tanstack/react-form";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { MapLibreMap, Marker } from "maplibre-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	BusinessSelectField,
	CountrySelectField,
	ImageUploadField,
	ParentLocationSelectField,
	TagsField,
	TextareaField,
	TextField,
} from "@/components/shared/form-fields";
import { WorkOrderListItem } from "@/components/shared/work-order-list-item";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { PanelDetailSection } from "@/components/ui/panel-layout";
import { Spinner } from "@/components/ui/spinner";
import type { FieldStatus } from "@/hooks/use-auto-save";
import { useDebounce } from "@/hooks/use-debounce";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { loadMap, MAP_STYLE } from "@/lib/map";
import {
	buildOrgEntityDetailLink,
	openOrgEntityDetailInNewTab,
} from "@/lib/org-entity-detail-links";
import { businessesQueryOptions } from "@/lib/queries/businesses";
import { locationsQueryOptions } from "@/lib/queries/locations";
import { tagsQueryOptions, useCreateTagMutation } from "@/lib/queries/tags";
import { useUploadMutation } from "@/lib/queries/upload";
import { workOrdersInfiniteQueryOptions } from "@/lib/queries/work-orders";
import { mergeById } from "@/lib/utils";
import * as m from "@/paraglide/messages";
import type {
	LocationAssetItemResponse,
	LocationResponse,
	LocationUpdatePayload,
} from "@/server/domains/locations/schema";
import { convertToWebP } from "@/utils/image";
import { DEFAULT_CREATE_VALUES, type LocationFormValues } from "./-types";

function parseCoordinatesFromText(text: string): {
	lat: number;
	lng: number;
} | null {
	const patterns = [
		/@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
		/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
		/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
		/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
	];

	for (const pattern of patterns) {
		const match = text.match(pattern);
		if (match) {
			const lat = Number.parseFloat(match[1]);
			const lng = Number.parseFloat(match[2]);
			if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
				return { lat, lng };
			}
		}
	}

	const genericMatch = text.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
	if (genericMatch) {
		const lat = Number.parseFloat(genericMatch[1]);
		const lng = Number.parseFloat(genericMatch[2]);
		if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
			return { lat, lng };
		}
	}

	return null;
}

type LocationFormMode = "create" | "edit";

interface LocationFormProps {
	mode: LocationFormMode;
	orgId: string;
	activeTab?: string;
	location?: LocationResponse;
	locationAssets?: LocationAssetItemResponse[];
	onAutoSave?: (values: LocationFormValues) => Promise<void>;
	getFieldStatus?: (fieldName: string) => FieldStatus;
	getFieldError?: (fieldName: string) => string | undefined;
	handleFieldChange?: (fieldName: string) => void;
	onSubmit?: (values: LocationFormValues) => Promise<void>;
	onCancel?: () => void;
	isSubmitting?: boolean;
}

function mapLocationToFormValues(
	location: LocationResponse,
): LocationFormValues {
	return {
		name: location.name,
		address: location.address ?? "",
		city: location.city ?? "",
		state: location.state ?? "",
		postal_code: location.postal_code ?? "",
		country: location.country ?? "",
		description: location.description ?? "",
		image_url: location.image_url ?? "",
		tag_ids: location.tags.map((t) => t.id),
		phones: location.phones ?? [],
		emails: location.emails ?? [],
		parent_location_id: location.parent_location_id ?? null,
		business_id: location.business_id ?? null,
		latitude: location.latitude ?? null,
		longitude: location.longitude ?? null,
	};
}

export function buildPartialUpdateRequest(
	values: LocationFormValues,
	modifiedFields: Set<string>,
) {
	const request: LocationUpdatePayload = {};

	if (modifiedFields.has("name") && values.name) {
		request.name = values.name;
	}
	if (modifiedFields.has("address")) {
		request.address = values.address;
	}
	if (modifiedFields.has("city")) {
		request.city = values.city;
	}
	if (modifiedFields.has("state")) {
		request.state = values.state;
	}
	if (modifiedFields.has("postal_code")) {
		request.postal_code = values.postal_code;
	}
	if (modifiedFields.has("country")) {
		request.country = values.country;
	}
	if (modifiedFields.has("description")) {
		request.description = values.description;
	}
	if (modifiedFields.has("image_url")) {
		request.image_url = values.image_url;
	}
	if (modifiedFields.has("phones")) {
		request.phones = values.phones;
	}
	if (modifiedFields.has("emails")) {
		request.emails = values.emails;
	}
	if (modifiedFields.has("parent_location_id")) {
		request.parent_location_id = values.parent_location_id ?? undefined;
	}
	if (modifiedFields.has("business_id")) {
		request.business_id = values.business_id;
	}
	if (modifiedFields.has("latitude") || modifiedFields.has("longitude")) {
		request.latitude = values.latitude ?? undefined;
		request.longitude = values.longitude ?? undefined;
	}

	return request;
}

export function mapFormValuesToCreateRequest(values: LocationFormValues) {
	return {
		name: values.name,
		address: values.address || undefined,
		city: values.city || undefined,
		state: values.state || undefined,
		postal_code: values.postal_code || undefined,
		country: values.country || undefined,
		description: values.description || undefined,
		image_url: values.image_url || undefined,
		tag_ids: values.tag_ids.length > 0 ? values.tag_ids : undefined,
		phones: values.phones.length > 0 ? values.phones : undefined,
		emails: values.emails.length > 0 ? values.emails : undefined,
		parent_location_id: values.parent_location_id ?? undefined,
		business_id: values.business_id ?? undefined,
		latitude: values.latitude ?? undefined,
		longitude: values.longitude ?? undefined,
	};
}

interface CoordinatesFieldProps {
	mapCoords: { lat: number; lng: number } | null;
	mapContainerRef: React.RefObject<HTMLDivElement | null>;
	onEdit: () => void;
	onClear: () => void;
	mapClassName: string;
}

function CoordinatesField({
	mapCoords,
	mapContainerRef,
	onEdit,
	onClear,
	mapClassName,
}: CoordinatesFieldProps) {
	if (!mapCoords) {
		return (
			<>
				<div ref={mapContainerRef} className="hidden" />
				<button
					type="button"
					className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
					onClick={onEdit}
				>
					<MapPinIcon className="h-3.5 w-3.5" />
					{m.loc_add_coordinates()}
				</button>
			</>
		);
	}
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<span className="text-xs text-muted-foreground font-mono">
					{mapCoords.lat.toFixed(6)}, {mapCoords.lng.toFixed(6)}
				</span>
				<div className="flex gap-1">
					<Button type="button" variant="ghost" size="sm" onClick={onEdit}>
						{m.loc_edit_coordinates()}
					</Button>
					<Button type="button" variant="ghost" size="sm" onClick={onClear}>
						<XIcon className="h-3 w-3" />
					</Button>
				</div>
			</div>
			<div ref={mapContainerRef} className={mapClassName} />
		</div>
	);
}

export function LocationForm({
	mode,
	orgId,
	activeTab,
	location,
	locationAssets = [],
	onAutoSave,
	getFieldStatus,
	getFieldError,
	handleFieldChange,
	onSubmit,
	onCancel,
	isSubmitting,
}: LocationFormProps) {
	const isEditMode = mode === "edit";

	const { data: tagsData } = useQuery(tagsQueryOptions(orgId, "location"));
	const createTagMutation = useCreateTagMutation(orgId, "location");
	const allTags = tagsData ?? [];

	const uploadMutation = useUploadMutation();

	const selectsEnabled = mode === "create" || activeTab === "related";

	const [locationsSearchQuery, setLocationsSearchQuery] = useState("");
	const debouncedLocationsSearchQuery = useDebounce(locationsSearchQuery, 300);
	const { data: locationsData, isFetching: isLocationsSearching } = useQuery({
		...locationsQueryOptions(orgId, {
			page: 1,
			size: 20,
			q: debouncedLocationsSearchQuery || undefined,
		}),
		enabled: selectsEnabled,
	});

	const businessSelectEnabled = mode === "create" || activeTab === "overview";
	const [businessesSearchQuery, setBusinessesSearchQuery] = useState("");
	const debouncedBusinessesSearchQuery = useDebounce(
		businessesSearchQuery,
		300,
	);
	const { data: businessesData, isFetching: isBusinessesSearching } = useQuery({
		...businessesQueryOptions(orgId, {
			page: 1,
			size: 20,
			q: debouncedBusinessesSearchQuery || undefined,
		}),
		enabled: businessSelectEnabled,
	});

	const combinedBusinesses = mergeById(
		location?.business ? [location.business] : [],
		businessesData?.items ?? [],
	);

	const {
		data: workOrdersData,
		isLoading: isLoadingWorkOrders,
		fetchNextPage: fetchNextWorkOrders,
		hasNextPage: hasMoreWorkOrders,
		isFetchingNextPage: isFetchingMoreWorkOrders,
	} = useInfiniteQuery({
		...workOrdersInfiniteQueryOptions(orgId, {
			location_id: location?.id ?? 0,
			size: 20,
		}),
		enabled: isEditMode && activeTab === "related" && !!location?.id,
	});

	const workOrders =
		workOrdersData?.pages.flatMap((page) => page.items ?? []).filter(Boolean) ??
		[];

	const form = useForm({
		defaultValues:
			isEditMode && location
				? mapLocationToFormValues(location)
				: DEFAULT_CREATE_VALUES,
		listeners: isEditMode
			? {
					onChange: ({ formApi }) => {
						if (formApi.state.isValid && formApi.state.isDirty && onAutoSave) {
							formApi.handleSubmit();
						}
					},
					onChangeDebounceMs: 400,
				}
			: undefined,
		onSubmit: async ({ value }) => {
			if (isEditMode && onAutoSave) {
				await onAutoSave(value);
			} else if (onSubmit) {
				await onSubmit(value);
			}
		},
	});

	const fieldChangeHandler = isEditMode ? handleFieldChange : undefined;
	const getStatus = (field: string) =>
		isEditMode && getFieldStatus ? getFieldStatus(field) : undefined;

	const [coordsDialogOpen, setCoordsDialogOpen] = useState(false);
	const [linkInput, setLinkInput] = useState("");
	const [linkMessage, setLinkMessage] = useState<string | null>(null);
	const [mapCoords, setMapCoords] = useState<{
		lat: number;
		lng: number;
	} | null>(() => {
		const lat = form.getFieldValue("latitude");
		const lng = form.getFieldValue("longitude");
		return lat != null && lng != null ? { lat, lng } : null;
	});
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<MapLibreMap | null>(null);
	const markerRef = useRef<Marker | null>(null);

	const updateMapFromField = useCallback(
		(changedField: "latitude" | "longitude", newValue: number | null) => {
			const lat =
				changedField === "latitude" ? newValue : form.getFieldValue("latitude");
			const lng =
				changedField === "longitude"
					? newValue
					: form.getFieldValue("longitude");
			setMapCoords(lat != null && lng != null ? { lat, lng } : null);
		},
		[form],
	);

	useEffect(() => {
		if (!mapCoords || !mapContainerRef.current) {
			if (mapRef.current) {
				mapRef.current.remove();
				mapRef.current = null;
				markerRef.current = null;
			}
			return;
		}

		if (!mapRef.current) {
			const container = mapContainerRef.current;
			const coords = mapCoords;
			loadMap().then((mod) => {
				if (!container.isConnected || mapRef.current) return;
				const map = new mod.Map({
					container,
					style: MAP_STYLE,
					center: [coords.lng, coords.lat],
					zoom: 18,
					interactive: false,
				});
				const marker = new mod.Marker()
					.setLngLat([coords.lng, coords.lat])
					.addTo(map);
				mapRef.current = map;
				markerRef.current = marker;
			});
		} else {
			mapRef.current.setCenter([mapCoords.lng, mapCoords.lat]);
			markerRef.current?.setLngLat([mapCoords.lng, mapCoords.lat]);
		}
	}, [mapCoords]);

	useMountEffect(() => {
		return () => {
			if (mapRef.current) {
				mapRef.current.remove();
				mapRef.current = null;
				markerRef.current = null;
			}
		};
	});

	const handleLinkInputChange = useCallback(
		(value: string) => {
			setLinkInput(value);
			if (!value.trim()) {
				setLinkMessage(null);
				return;
			}
			const coords = parseCoordinatesFromText(value);
			if (coords) {
				form.setFieldValue("latitude", coords.lat);
				form.setFieldValue("longitude", coords.lng);
				setMapCoords(coords);
				fieldChangeHandler?.("latitude");
				fieldChangeHandler?.("longitude");
				setLinkMessage(m.loc_coordinates_extracted());
			} else {
				setLinkMessage(null);
			}
		},
		[form, fieldChangeHandler],
	);

	const handleClearCoordinates = useCallback(() => {
		form.setFieldValue("latitude", null);
		form.setFieldValue("longitude", null);
		setMapCoords(null);
		fieldChangeHandler?.("latitude");
		fieldChangeHandler?.("longitude");
		setLinkInput("");
		setLinkMessage(null);
	}, [form, fieldChangeHandler]);

	const coordsDialog = (
		<Dialog open={coordsDialogOpen} onOpenChange={setCoordsDialogOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{m.loc_coordinates()}</DialogTitle>
					<DialogDescription>
						{m.loc_paste_link_placeholder()}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<Field>
						<InputGroup>
							<InputGroupInput
								type="text"
								value={linkInput}
								onChange={(e) => handleLinkInputChange(e.target.value)}
								placeholder={m.loc_paste_link_placeholder()}
							/>
						</InputGroup>
						{linkMessage && (
							<p className="text-xs text-primary">{linkMessage}</p>
						)}
					</Field>
					<div className="grid grid-cols-2 gap-3">
						<form.Field name="latitude">
							{(field) => (
								<Field>
									<FieldLabel>{m.loc_latitude()}</FieldLabel>
									<InputGroup>
										<InputGroupInput
											type="number"
											step="any"
											min={-90}
											max={90}
											value={field.state.value ?? ""}
											onChange={(e) => {
												const val =
													e.target.value === ""
														? null
														: Number.parseFloat(e.target.value);
												field.handleChange(val);
												fieldChangeHandler?.("latitude");
												updateMapFromField("latitude", val);
											}}
											onBlur={field.handleBlur}
											placeholder={m.loc_latitude_placeholder()}
										/>
									</InputGroup>
								</Field>
							)}
						</form.Field>
						<form.Field name="longitude">
							{(field) => (
								<Field>
									<FieldLabel>{m.loc_longitude()}</FieldLabel>
									<InputGroup>
										<InputGroupInput
											type="number"
											step="any"
											min={-180}
											max={180}
											value={field.state.value ?? ""}
											onChange={(e) => {
												const val =
													e.target.value === ""
														? null
														: Number.parseFloat(e.target.value);
												field.handleChange(val);
												fieldChangeHandler?.("longitude");
												updateMapFromField("longitude", val);
											}}
											onBlur={field.handleBlur}
											placeholder={m.loc_longitude_placeholder()}
										/>
									</InputGroup>
								</Field>
							)}
						</form.Field>
					</div>
				</div>
				<DialogFooter>
					<Button type="button" onClick={() => setCoordsDialogOpen(false)}>
						OK
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);

	if (isEditMode) {
		const tab = activeTab ?? "overview";

		return (
			<>
				{tab === "overview" && (
					<div className="space-y-8">
						<PanelDetailSection title={m.loc_section_basic()}>
							<div className="space-y-4">
								<TextField
									form={form}
									name="name"
									label={m.loc_field_name()}
									placeholder={m.loc_placeholder_name()}
									onFieldChange={fieldChangeHandler}
									status={getStatus("name")}
									required
									error={getFieldError?.("name")}
								/>

								<TextField
									form={form}
									name="address"
									label={m.loc_field_address()}
									placeholder={m.loc_placeholder_address()}
									onFieldChange={fieldChangeHandler}
									status={getStatus("address")}
								/>

								<TextField
									form={form}
									name="city"
									label={m.loc_field_city()}
									placeholder={m.loc_placeholder_city()}
									onFieldChange={fieldChangeHandler}
									status={getStatus("city")}
								/>

								<TextField
									form={form}
									name="state"
									label={m.loc_field_state()}
									placeholder={m.loc_placeholder_state()}
									onFieldChange={fieldChangeHandler}
									status={getStatus("state")}
								/>

								<TextField
									form={form}
									name="postal_code"
									label={m.loc_field_postal_code()}
									placeholder={m.loc_placeholder_postal_code()}
									onFieldChange={fieldChangeHandler}
									status={getStatus("postal_code")}
								/>

								<CountrySelectField
									form={form}
									name="country"
									label={m.loc_field_country()}
									placeholder={m.loc_placeholder_country()}
									emptyText={m.loc_empty_country()}
									onFieldChange={fieldChangeHandler}
									status={getStatus("country")}
								/>

								<TextareaField
									form={form}
									name="description"
									label={m.loc_field_description()}
									placeholder={m.loc_placeholder_description()}
									onFieldChange={fieldChangeHandler}
									status={getStatus("description")}
								/>

								<BusinessSelectField
									form={form}
									name="business_id"
									label={m.loc_field_business()}
									businesses={combinedBusinesses}
									onSearch={setBusinessesSearchQuery}
									isSearching={isBusinessesSearching}
									onFieldChange={fieldChangeHandler}
									status={getStatus("business_id")}
									getItemDetailLink={(id) =>
										buildOrgEntityDetailLink(orgId, "businesses", id)
									}
								/>

								<CoordinatesField
									mapCoords={mapCoords}
									mapContainerRef={mapContainerRef}
									onEdit={() => setCoordsDialogOpen(true)}
									onClear={handleClearCoordinates}
									mapClassName="h-52 w-full rounded-md overflow-hidden ring-1 ring-border"
								/>
							</div>
						</PanelDetailSection>
					</div>
				)}

				{tab === "related" && (
					<div className="space-y-8">
						<PanelDetailSection title={m.loc_section_related()}>
							<div className="space-y-4">
								<ParentLocationSelectField
									form={form}
									locations={locationsData?.items ?? []}
									excludeLocationId={location?.id}
									onSearch={setLocationsSearchQuery}
									isSearching={isLocationsSearching}
									onFieldChange={fieldChangeHandler}
									status={getStatus("parent_location_id")}
									getItemDetailLink={(id) =>
										buildOrgEntityDetailLink(orgId, "locations", id)
									}
								/>

								{locationAssets.length > 0 && (
									<Field>
										<FieldLabel>{m.shared_field_assets()}</FieldLabel>
										<div className="space-y-2">
											{locationAssets.map((asset) => {
												const link = buildOrgEntityDetailLink(
													orgId,
													"assets",
													asset.id,
												);
												return (
													<Item key={asset.id} variant="outline">
														<ItemMedia variant="image">
															{asset.image_url ? (
																<img src={asset.image_url} alt="" />
															) : (
																<HardDriveIcon
																	className="w-5 h-5 text-muted-foreground"
																	weight="duotone"
																/>
															)}
														</ItemMedia>
														<ItemContent>
															<ItemTitle link={link}>{asset.name}</ItemTitle>
															{asset.serial_number && (
																<ItemDescription>
																	{asset.serial_number}
																</ItemDescription>
															)}
														</ItemContent>
													</Item>
												);
											})}
										</div>
									</Field>
								)}
							</div>
						</PanelDetailSection>

						<PanelDetailSection title={m.wo_title()}>
							{isLoadingWorkOrders ? (
								<div className="flex justify-center py-6">
									<Spinner className="size-5" />
								</div>
							) : workOrders.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									{m.wo_empty_title()}
								</p>
							) : (
								<div className="overflow-hidden rounded-lg border [&>button:last-of-type]:border-b-0">
									{workOrders.map((workOrder) => (
										<WorkOrderListItem
											key={workOrder.id}
											workOrder={workOrder}
											isSelected={false}
											onClick={() =>
												openOrgEntityDetailInNewTab(
													orgId,
													"work-orders",
													workOrder.id,
												)
											}
										/>
									))}
									{hasMoreWorkOrders && (
										<Button
											variant="ghost"
											size="sm"
											className="w-full rounded-none"
											onClick={() => fetchNextWorkOrders()}
											disabled={isFetchingMoreWorkOrders}
										>
											{isFetchingMoreWorkOrders ? (
												<Spinner className="size-4" />
											) : (
												m.wo_load_more()
											)}
										</Button>
									)}
								</div>
							)}
						</PanelDetailSection>
					</div>
				)}

				{coordsDialog}
			</>
		);
	}

	const createFormContent = (
		<>
			<PanelDetailSection title={m.loc_section_image()}>
				<ImageUploadField
					form={form}
					fallbackIcon={MapPinIcon}
					altText="Location"
					isUploading={uploadMutation.isPending}
					onFieldChange={fieldChangeHandler}
					onUpload={async (file) => {
						const webpFile = await convertToWebP(file);
						const result = await uploadMutation.mutateAsync({
							organizationId: orgId,
							file: webpFile,
							folder: "locations",
						});
						return result.url;
					}}
					status={getStatus("image_url")}
					autoSubmit={false}
				/>
			</PanelDetailSection>

			<PanelDetailSection title={m.loc_section_basic()}>
				<div className="space-y-4">
					<TextField
						form={form}
						name="name"
						label={m.loc_field_name()}
						placeholder={m.loc_placeholder_name()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("name")}
						required
						error={getFieldError?.("name")}
					/>

					<TextField
						form={form}
						name="address"
						label={m.loc_field_address()}
						placeholder={m.loc_placeholder_address()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("address")}
					/>

					<TextField
						form={form}
						name="city"
						label={m.loc_field_city()}
						placeholder={m.loc_placeholder_city()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("city")}
					/>

					<TextField
						form={form}
						name="state"
						label={m.loc_field_state()}
						placeholder={m.loc_placeholder_state()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("state")}
					/>

					<TextField
						form={form}
						name="postal_code"
						label={m.loc_field_postal_code()}
						placeholder={m.loc_placeholder_postal_code()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("postal_code")}
					/>

					<CountrySelectField
						form={form}
						name="country"
						label={m.loc_field_country()}
						placeholder={m.loc_placeholder_country()}
						emptyText={m.loc_empty_country()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("country")}
					/>

					<TextareaField
						form={form}
						name="description"
						label={m.loc_field_description()}
						placeholder={m.loc_placeholder_description()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("description")}
					/>

					<BusinessSelectField
						form={form}
						name="business_id"
						label={m.loc_field_business()}
						businesses={combinedBusinesses}
						onSearch={setBusinessesSearchQuery}
						isSearching={isBusinessesSearching}
						onFieldChange={fieldChangeHandler}
						status={getStatus("business_id")}
						getItemDetailLink={(id) =>
							buildOrgEntityDetailLink(orgId, "businesses", id)
						}
					/>

					<TagsField
						form={form}
						allTags={allTags}
						onTagCreate={async (name) => {
							const result = await createTagMutation.mutateAsync({ name });
							return result.id;
						}}
						onFieldChange={(fieldName) => {
							fieldChangeHandler?.(fieldName);
						}}
						status={getStatus("tag_ids")}
					/>

					<CoordinatesField
						mapCoords={mapCoords}
						mapContainerRef={mapContainerRef}
						onEdit={() => setCoordsDialogOpen(true)}
						onClear={handleClearCoordinates}
						mapClassName="h-70 w-full rounded-lg overflow-hidden"
					/>

					{coordsDialog}
				</div>
			</PanelDetailSection>

			<PanelDetailSection title={m.loc_section_related()}>
				<div className="space-y-4">
					<ParentLocationSelectField
						form={form}
						locations={locationsData?.items ?? []}
						excludeLocationId={location?.id}
						onSearch={setLocationsSearchQuery}
						isSearching={isLocationsSearching}
						onFieldChange={fieldChangeHandler}
						status={getStatus("parent_location_id")}
						getItemDetailLink={(id) =>
							buildOrgEntityDetailLink(orgId, "locations", id)
						}
					/>
				</div>
			</PanelDetailSection>

			<div className="flex gap-3 mt-5">
				<Button type="button" variant="outline" onClick={onCancel}>
					{m.loc_button_cancel()}
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? m.loc_button_creating() : m.loc_button_create()}
				</Button>
			</div>
		</>
	);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="space-y-4"
		>
			{createFormContent}
		</form>
	);
}
