import { HardDriveIcon } from "@phosphor-icons/react/dist/csr/HardDrive";
import { useForm } from "@tanstack/react-form";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
	ImageUploadField,
	LocationSelectField,
	ParentAssetSelectField,
	TagsField,
	TextareaField,
	TextField,
} from "@/components/shared/form-fields";
import { WorkOrderListItem } from "@/components/shared/work-order-list-item";
import { Button } from "@/components/ui/button";
import { PanelDetailSection } from "@/components/ui/panel-layout";
import { Spinner } from "@/components/ui/spinner";
import type { FieldStatus } from "@/hooks/use-auto-save";
import { useDebounce } from "@/hooks/use-debounce";
import {
	buildOrgEntityDetailLink,
	openOrgEntityDetailInNewTab,
} from "@/lib/org-entity-detail-links";
import { assetsQueryOptions } from "@/lib/queries/assets";
import { locationsQueryOptions } from "@/lib/queries/locations";
import { tagsQueryOptions, useCreateTagMutation } from "@/lib/queries/tags";
import { useUploadMutation } from "@/lib/queries/upload";
import { workOrdersInfiniteQueryOptions } from "@/lib/queries/work-orders";
import { mergeById } from "@/lib/utils";
import * as m from "@/paraglide/messages";
import type {
	AssetResponse,
	AssetUpdatePayload,
} from "@/server/domains/assets/schema";
import type { LocationResponse } from "@/server/domains/locations/schema";
import { convertToWebP } from "@/utils/image";
import {
	AssignmentStatusSelectField,
	CriticalitySelectField,
	StatusSelectField,
} from "./-form-fields";
import {
	type AssetFormMode,
	type AssetFormValues,
	DEFAULT_CREATE_VALUES,
} from "./-types";

interface AssetFormProps {
	mode: AssetFormMode;
	orgId: string;
	activeTab?: string;
	asset?: AssetResponse;
	assetLocation?: LocationResponse;
	parentAsset?: AssetResponse;
	onAutoSave?: (values: AssetFormValues) => Promise<void>;
	getFieldStatus?: (fieldName: string) => FieldStatus;
	getFieldError?: (fieldName: string) => string | undefined;
	handleFieldChange?: (fieldName: string) => void;
	onSubmit?: (values: AssetFormValues) => Promise<void>;
	onCancel?: () => void;
	isSubmitting?: boolean;
}

function mapAssetToFormValues(asset: AssetResponse): AssetFormValues {
	return {
		name: asset.name,
		serial_number: asset.serial_number ?? "",
		model: asset.model ?? "",
		manufacturer: asset.manufacturer ?? "",
		description: asset.description ?? "",
		status: asset.status,
		criticality: asset.criticality,
		assignment_status: asset.assignment_status,
		image_url: asset.image_url ?? "",
		tag_ids: asset.tags.map((t) => t.id),
		location_id: asset.location_id ?? null,
		parent_asset_id: asset.parent_asset_id ?? null,
	};
}

export function buildPartialUpdateRequest(
	values: AssetFormValues,
	modifiedFields: Set<string>,
) {
	const request: AssetUpdatePayload = {};

	if (modifiedFields.has("name") && values.name) {
		request.name = values.name;
	}
	if (modifiedFields.has("serial_number")) {
		request.serial_number = values.serial_number;
	}
	if (modifiedFields.has("model")) {
		request.model = values.model;
	}
	if (modifiedFields.has("manufacturer")) {
		request.manufacturer = values.manufacturer;
	}
	if (modifiedFields.has("description")) {
		request.description = values.description;
	}
	if (modifiedFields.has("status")) {
		request.status = values.status;
	}
	if (modifiedFields.has("criticality")) {
		request.criticality = values.criticality;
	}
	if (modifiedFields.has("assignment_status")) {
		request.assignment_status = values.assignment_status;
	}
	if (modifiedFields.has("image_url")) {
		request.image_url = values.image_url;
	}
	if (modifiedFields.has("location_id")) {
		request.location_id = values.location_id;
	}
	if (modifiedFields.has("parent_asset_id")) {
		request.parent_asset_id = values.parent_asset_id;
	}

	return request;
}

export function mapFormValuesToCreateRequest(values: AssetFormValues) {
	return {
		name: values.name,
		serial_number: values.serial_number || undefined,
		model: values.model || undefined,
		manufacturer: values.manufacturer || undefined,
		description: values.description || undefined,
		status: values.status,
		criticality: values.criticality,
		assignment_status: values.assignment_status,
		image_url: values.image_url || undefined,
		tag_ids: values.tag_ids.length > 0 ? values.tag_ids : undefined,
		location_id: values.location_id ?? undefined,
		parent_asset_id: values.parent_asset_id ?? undefined,
	};
}

export function AssetForm({
	mode,
	orgId,
	activeTab,
	asset,
	assetLocation,
	parentAsset,
	onAutoSave,
	getFieldStatus,
	getFieldError,
	handleFieldChange,
	onSubmit,
	onCancel,
	isSubmitting,
}: AssetFormProps) {
	const isEditMode = mode === "edit";

	const { data: tagsData } = useQuery(tagsQueryOptions(orgId, "asset"));
	const createTagMutation = useCreateTagMutation(orgId, "asset");
	const allTags = tagsData ?? [];

	const uploadMutation = useUploadMutation();

	const [locationsSearchQuery, setLocationsSearchQuery] = useState("");
	const debouncedLocationsSearchQuery = useDebounce(locationsSearchQuery, 400);
	const selectsEnabled = mode === "create" || activeTab === "related";
	const { data: locationsData, isFetching: isLocationsSearching } = useQuery({
		...locationsQueryOptions(orgId, {
			page: 1,
			size: 20,
			q: debouncedLocationsSearchQuery || undefined,
		}),
		enabled: selectsEnabled,
	});

	const combinedLocations = mergeById(
		assetLocation ? [assetLocation] : [],
		locationsData?.items ?? [],
	);

	const [assetsSearchQuery, setAssetsSearchQuery] = useState("");
	const debouncedAssetsSearchQuery = useDebounce(assetsSearchQuery, 300);
	const { data: assetsData, isFetching: isAssetsSearching } = useQuery({
		...assetsQueryOptions(orgId, {
			page: 1,
			size: 20,
			q: debouncedAssetsSearchQuery || undefined,
		}),
		enabled: selectsEnabled,
	});

	const combinedParentAssets = mergeById(
		parentAsset ? [parentAsset] : [],
		assetsData?.items ?? [],
	);

	const {
		data: workOrdersData,
		isLoading: isLoadingWorkOrders,
		fetchNextPage: fetchNextWorkOrders,
		hasNextPage: hasMoreWorkOrders,
		isFetchingNextPage: isFetchingMoreWorkOrders,
	} = useInfiniteQuery({
		...workOrdersInfiniteQueryOptions(orgId, {
			asset_id: asset?.id ?? 0,
			size: 20,
		}),
		enabled: isEditMode && activeTab === "related" && !!asset?.id,
	});

	const workOrders =
		workOrdersData?.pages.flatMap((page) => page.items ?? []).filter(Boolean) ??
		[];

	const form = useForm({
		defaultValues:
			isEditMode && asset ? mapAssetToFormValues(asset) : DEFAULT_CREATE_VALUES,
		listeners: isEditMode
			? {
					onChange: ({ formApi }) => {
						if (formApi.state.isValid && onAutoSave) {
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

	const fieldChangeHandler = handleFieldChange;
	const getStatus = (field: string) =>
		isEditMode && getFieldStatus ? getFieldStatus(field) : undefined;

	if (isEditMode) {
		const tab = activeTab ?? "overview";

		return (
			<>
				{tab === "overview" && (
					<div className="space-y-8">
						<PanelDetailSection title={m.assets_section_details()}>
							<div className="space-y-4">
								<TextField
									form={form}
									name="name"
									label={m.assets_field_name()}
									placeholder={m.assets_placeholder_name()}
									onFieldChange={fieldChangeHandler}
									status={getStatus("name")}
									required
									error={getFieldError?.("name")}
								/>

								<TextField
									form={form}
									name="serial_number"
									label={m.assets_field_serial_number()}
									placeholder={m.assets_placeholder_serial_number()}
									onFieldChange={fieldChangeHandler}
									status={getStatus("serial_number")}
									error={getFieldError?.("serial_number")}
								/>

								<TextareaField
									form={form}
									name="description"
									label={m.assets_field_description()}
									placeholder={m.assets_placeholder_description()}
									onFieldChange={fieldChangeHandler}
									status={getStatus("description")}
								/>

								<StatusSelectField
									form={form}
									onFieldChange={fieldChangeHandler}
									status={getStatus("status")}
									required
								/>

								<CriticalitySelectField
									form={form}
									onFieldChange={fieldChangeHandler}
									status={getStatus("criticality")}
									required
								/>

								<AssignmentStatusSelectField
									form={form}
									onFieldChange={fieldChangeHandler}
									status={getStatus("assignment_status")}
								/>

								<TextField
									form={form}
									name="model"
									label={m.assets_field_model()}
									placeholder={m.assets_placeholder_model()}
									onFieldChange={fieldChangeHandler}
									status={getStatus("model")}
								/>

								<TextField
									form={form}
									name="manufacturer"
									label={m.assets_field_manufacturer()}
									placeholder={m.assets_placeholder_manufacturer()}
									onFieldChange={fieldChangeHandler}
									status={getStatus("manufacturer")}
								/>
							</div>
						</PanelDetailSection>
					</div>
				)}

				{tab === "related" && (
					<div className="space-y-8">
						<PanelDetailSection title={m.assets_section_related()}>
							<div className="space-y-4">
								<LocationSelectField
									form={form}
									locations={combinedLocations}
									onSearch={setLocationsSearchQuery}
									isSearching={isLocationsSearching}
									onFieldChange={fieldChangeHandler}
									status={getStatus("location_id")}
									getItemDetailLink={(id) =>
										buildOrgEntityDetailLink(orgId, "locations", id)
									}
								/>

								<ParentAssetSelectField
									form={form}
									assets={combinedParentAssets}
									excludeAssetId={asset?.id}
									onSearch={setAssetsSearchQuery}
									isSearching={isAssetsSearching}
									onFieldChange={fieldChangeHandler}
									status={getStatus("parent_asset_id")}
									getItemDetailLink={(id) =>
										buildOrgEntityDetailLink(orgId, "assets", id)
									}
								/>
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
			</>
		);
	}

	const createFormContent = (
		<>
			<PanelDetailSection
				title={m.assets_section_image()}
				action={
					getFieldStatus ? (
						<span className="text-xs text-muted-foreground">
							{getFieldStatus("image_url") === "saving" &&
								m.assets_image_saving()}
							{getFieldStatus("image_url") === "success" &&
								m.assets_image_saved()}
						</span>
					) : undefined
				}
			>
				<ImageUploadField
					form={form}
					fallbackIcon={HardDriveIcon}
					altText="Asset"
					isUploading={uploadMutation.isPending}
					onFieldChange={fieldChangeHandler}
					onUpload={async (file) => {
						const webpFile = await convertToWebP(file);
						const result = await uploadMutation.mutateAsync({
							organizationId: orgId,
							file: webpFile,
							folder: "assets",
						});
						return result.url;
					}}
					status={getStatus("image_url")}
					autoSubmit={false}
				/>
			</PanelDetailSection>

			<PanelDetailSection title={m.assets_section_details()}>
				<div className="space-y-4">
					<TextField
						form={form}
						name="name"
						label={m.assets_field_name()}
						placeholder={m.assets_placeholder_name_required()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("name")}
						required
						error={getFieldError?.("name")}
					/>

					<TextField
						form={form}
						name="serial_number"
						label={m.assets_field_serial_number()}
						placeholder={m.assets_placeholder_serial_number()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("serial_number")}
						error={getFieldError?.("serial_number")}
					/>

					<TextareaField
						form={form}
						name="description"
						label={m.assets_field_description()}
						placeholder={m.assets_placeholder_description()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("description")}
					/>

					<StatusSelectField
						form={form}
						onFieldChange={fieldChangeHandler}
						status={getStatus("status")}
						required
					/>

					<CriticalitySelectField
						form={form}
						onFieldChange={fieldChangeHandler}
						status={getStatus("criticality")}
						required
					/>

					<AssignmentStatusSelectField
						form={form}
						onFieldChange={fieldChangeHandler}
						status={getStatus("assignment_status")}
					/>

					<TextField
						form={form}
						name="model"
						label={m.assets_field_model()}
						placeholder={m.assets_placeholder_model()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("model")}
					/>

					<TextField
						form={form}
						name="manufacturer"
						label={m.assets_field_manufacturer()}
						placeholder={m.assets_placeholder_manufacturer()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("manufacturer")}
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
				</div>
			</PanelDetailSection>

			<PanelDetailSection title={m.assets_section_related()}>
				<div className="space-y-4">
					<LocationSelectField
						form={form}
						locations={combinedLocations}
						onSearch={setLocationsSearchQuery}
						isSearching={isLocationsSearching}
						onFieldChange={fieldChangeHandler}
						status={getStatus("location_id")}
						getItemDetailLink={(id) =>
							buildOrgEntityDetailLink(orgId, "locations", id)
						}
					/>

					<ParentAssetSelectField
						form={form}
						assets={combinedParentAssets}
						excludeAssetId={asset?.id}
						onSearch={setAssetsSearchQuery}
						isSearching={isAssetsSearching}
						onFieldChange={fieldChangeHandler}
						status={getStatus("parent_asset_id")}
						getItemDetailLink={(id) =>
							buildOrgEntityDetailLink(orgId, "assets", id)
						}
					/>
				</div>
			</PanelDetailSection>

			<div className="flex gap-3 mt-5">
				<Button type="button" variant="outline" onClick={onCancel}>
					{m.assets_button_cancel()}
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? m.assets_button_creating() : m.assets_button_create()}
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
