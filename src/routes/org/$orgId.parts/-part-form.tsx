import { CubeIcon } from "@phosphor-icons/react/dist/csr/Cube";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { useForm } from "@tanstack/react-form";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
	ImageUploadField,
	TagsField,
	TextareaField,
	TextField,
} from "@/components/shared/form-fields";
import { WorkOrderListItem } from "@/components/shared/work-order-list-item";
import { Button } from "@/components/ui/button";
import { PanelDetailSection } from "@/components/ui/panel-layout";
import { Spinner } from "@/components/ui/spinner";
import type { FieldStatus } from "@/hooks/use-auto-save";
import { openOrgEntityDetailInNewTab } from "@/lib/org-entity-detail-links";
import { tagsQueryOptions, useCreateTagMutation } from "@/lib/queries/tags";
import { useUploadMutation } from "@/lib/queries/upload";
import { workOrdersInfiniteQueryOptions } from "@/lib/queries/work-orders";
import * as m from "@/paraglide/messages";
import type {
	PartResponse,
	PartUpdatePayload,
} from "@/server/domains/parts/schema";
import { convertToWebP } from "@/utils/image";
import { CurrencyField, NumberField, UnitOfMeasureField } from "./-form-fields";
import {
	DEFAULT_CREATE_VALUES,
	isLowStock,
	type PartFormMode,
	type PartFormValues,
} from "./-types";

interface PartFormProps {
	mode: PartFormMode;
	orgId: string;
	activeTab?: string;
	part?: PartResponse;
	onAutoSave?: (values: PartFormValues) => Promise<void>;
	getFieldStatus?: (fieldName: string) => FieldStatus;
	getFieldError?: (fieldName: string) => string | undefined;
	handleFieldChange?: (fieldName: string) => void;
	onSubmit?: (values: PartFormValues) => Promise<void>;
	onCancel?: () => void;
	isSubmitting?: boolean;
}

function mapPartToFormValues(part: PartResponse): PartFormValues {
	return {
		sku: part.sku ?? "",
		name: part.name,
		description: part.description ?? "",
		quantity: String(part.quantity),
		min_quantity: String(part.min_quantity),
		unit_price: String(part.unit_price),
		currency: part.currency ?? "",
		unit_of_measure: part.unit_of_measure ?? "",
		image_url: part.image_url ?? "",
		tag_ids: part.tags.map((t) => t.id),
	};
}

export function buildPartialUpdateRequest(
	values: PartFormValues,
	modifiedFields: Set<string>,
) {
	const request: PartUpdatePayload = {};

	if (modifiedFields.has("name") && values.name) {
		request.name = values.name;
	}
	if (modifiedFields.has("sku")) {
		request.sku = values.sku;
	}
	if (modifiedFields.has("description")) {
		request.description = values.description;
	}
	if (modifiedFields.has("quantity")) {
		request.quantity = Number(values.quantity) || 0;
	}
	if (modifiedFields.has("min_quantity")) {
		request.min_quantity = Number(values.min_quantity) || 0;
	}
	if (modifiedFields.has("unit_price")) {
		request.unit_price = Number(values.unit_price) || 0;
	}
	if (modifiedFields.has("currency")) {
		request.currency = values.currency;
	}
	if (modifiedFields.has("unit_of_measure")) {
		request.unit_of_measure = values.unit_of_measure;
	}
	if (modifiedFields.has("image_url")) {
		request.image_url = values.image_url;
	}

	return request;
}

export function mapFormValuesToCreateRequest(values: PartFormValues) {
	return {
		sku: values.sku || undefined,
		name: values.name,
		description: values.description || undefined,
		quantity: Number(values.quantity) || 0,
		min_quantity: Number(values.min_quantity) || 0,
		unit_price: Number(values.unit_price) || 0,
		currency: values.currency || undefined,
		unit_of_measure: values.unit_of_measure || undefined,
		image_url: values.image_url || undefined,
		tag_ids: values.tag_ids.length > 0 ? values.tag_ids : undefined,
	};
}

export function PartForm({
	mode,
	orgId,
	activeTab,
	part,
	onAutoSave,
	getFieldStatus,
	getFieldError,
	handleFieldChange,
	onSubmit,
	onCancel,
	isSubmitting,
}: PartFormProps) {
	const isEditMode = mode === "edit";

	const { data: tagsData } = useQuery(tagsQueryOptions(orgId, "part"));
	const createTagMutation = useCreateTagMutation(orgId, "part");
	const allTags = tagsData ?? [];

	const uploadMutation = useUploadMutation();

	const form = useForm({
		defaultValues:
			isEditMode && part ? mapPartToFormValues(part) : DEFAULT_CREATE_VALUES,
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

	const quantity = Number(form.getFieldValue("quantity")) || 0;
	const minQuantity = Number(form.getFieldValue("min_quantity")) || 0;
	const isBelow = isEditMode && isLowStock(quantity, minQuantity);
	const stockPercentage = Math.max(
		0,
		Math.min((quantity / Math.max(minQuantity, 1)) * 100, 100),
	);

	const {
		data: workOrdersData,
		isLoading: isLoadingWorkOrders,
		fetchNextPage: fetchNextWorkOrders,
		hasNextPage: hasMoreWorkOrders,
		isFetchingNextPage: isFetchingMoreWorkOrders,
	} = useInfiniteQuery({
		...workOrdersInfiniteQueryOptions(orgId, {
			part_id: part?.id ?? 0,
			size: 20,
		}),
		enabled: isEditMode && activeTab === "related" && !!part?.id,
	});

	const workOrders =
		workOrdersData?.pages.flatMap((page) => page.items ?? []).filter(Boolean) ??
		[];

	if (isEditMode) {
		const tab = activeTab ?? "overview";

		return (
			<>
				{tab === "overview" && (
					<div className="space-y-8">
						<PanelDetailSection title={m.parts_section_details()}>
							<div className="space-y-4">
								<TextField
									form={form}
									name="name"
									label={m.parts_field_name()}
									placeholder={m.parts_placeholder_name()}
									onFieldChange={fieldChangeHandler}
									status={getStatus("name")}
									required
									error={getFieldError?.("name")}
								/>

								<TextField
									form={form}
									name="sku"
									label={m.parts_field_sku()}
									placeholder={m.parts_placeholder_sku()}
									onFieldChange={fieldChangeHandler}
									status={getStatus("sku")}
									error={getFieldError?.("sku")}
								/>

								<TextareaField
									form={form}
									name="description"
									label={m.parts_field_description()}
									placeholder={m.parts_placeholder_description()}
									onFieldChange={fieldChangeHandler}
									status={getStatus("description")}
								/>

								<NumberField
									form={form}
									name="unit_price"
									label={m.parts_field_unit_price()}
									onFieldChange={fieldChangeHandler}
									status={getStatus("unit_price")}
									error={getFieldError?.("unit_price")}
								/>

								<CurrencyField
									form={form}
									onFieldChange={fieldChangeHandler}
									status={getStatus("currency")}
								/>

								<UnitOfMeasureField
									form={form}
									onFieldChange={fieldChangeHandler}
									status={getStatus("unit_of_measure")}
								/>
							</div>
						</PanelDetailSection>
					</div>
				)}

				{tab === "stock" && (
					<div className="space-y-8">
						<PanelDetailSection title={m.parts_section_stock()}>
							<div className="space-y-4">
								<div className="flex items-baseline gap-3">
									<span
										className={`text-3xl font-bold tabular-nums ${isBelow ? "text-destructive" : ""}`}
									>
										{quantity}
									</span>
									<span className="text-sm text-muted-foreground">
										{m.parts_stock_min({ min: minQuantity })}
									</span>
									{isBelow && (
										<span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
											<WarningCircleIcon className="size-3.5" weight="fill" />
											{m.parts_stock_below_minimum()}
										</span>
									)}
								</div>

								<div className="space-y-1.5">
									<div className="h-2 w-full bg-muted rounded-full overflow-hidden">
										<div
											className={`h-full rounded-full transition-all ${
												isBelow ? "bg-destructive" : "bg-primary"
											}`}
											style={{ width: `${stockPercentage}%` }}
										/>
									</div>
									<p className="text-xs text-muted-foreground">
										{isBelow
											? m.parts_stock_units_below({
													count: minQuantity - quantity,
												})
											: m.parts_stock_units_above({
													count: quantity - minQuantity,
												})}
									</p>
								</div>

								<NumberField
									form={form}
									name="quantity"
									label={m.parts_field_quantity()}
									onFieldChange={fieldChangeHandler}
									status={getStatus("quantity")}
									error={getFieldError?.("quantity")}
								/>

								<NumberField
									form={form}
									name="min_quantity"
									label={m.parts_field_min_quantity()}
									onFieldChange={fieldChangeHandler}
									status={getStatus("min_quantity")}
									error={getFieldError?.("min_quantity")}
								/>
							</div>
						</PanelDetailSection>
					</div>
				)}

				{tab === "related" && (
					<div className="space-y-8">
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
				title={m.parts_section_image()}
				action={
					getFieldStatus ? (
						<span className="text-xs text-muted-foreground">
							{getFieldStatus("image_url") === "saving" &&
								m.parts_image_saving()}
							{getFieldStatus("image_url") === "success" &&
								m.parts_image_saved()}
						</span>
					) : undefined
				}
			>
				<ImageUploadField
					form={form}
					fallbackIcon={CubeIcon}
					altText="Part"
					isUploading={uploadMutation.isPending}
					onFieldChange={fieldChangeHandler}
					onUpload={async (file) => {
						const webpFile = await convertToWebP(file);
						const result = await uploadMutation.mutateAsync({
							organizationId: orgId,
							file: webpFile,
							folder: "parts",
						});
						return result.url;
					}}
					status={getStatus("image_url")}
					autoSubmit={false}
				/>
			</PanelDetailSection>

			<PanelDetailSection title={m.parts_section_details()}>
				<div className="space-y-4">
					<TextField
						form={form}
						name="name"
						label={m.parts_field_name()}
						placeholder={m.parts_placeholder_name_required()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("name")}
						required
						error={getFieldError?.("name")}
					/>

					<TextField
						form={form}
						name="sku"
						label={m.parts_field_sku()}
						placeholder={m.parts_placeholder_sku()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("sku")}
						error={getFieldError?.("sku")}
					/>

					<TextareaField
						form={form}
						name="description"
						label={m.parts_field_description()}
						placeholder={m.parts_placeholder_description()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("description")}
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

					<NumberField
						form={form}
						name="unit_price"
						label={m.parts_field_unit_price()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("unit_price")}
						error={getFieldError?.("unit_price")}
					/>

					<CurrencyField
						form={form}
						onFieldChange={fieldChangeHandler}
						status={getStatus("currency")}
					/>

					<UnitOfMeasureField
						form={form}
						onFieldChange={fieldChangeHandler}
						status={getStatus("unit_of_measure")}
					/>
				</div>
			</PanelDetailSection>

			<PanelDetailSection title={m.parts_section_stock()}>
				<div className="space-y-4">
					<NumberField
						form={form}
						name="quantity"
						label={m.parts_field_quantity()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("quantity")}
						error={getFieldError?.("quantity")}
					/>

					<NumberField
						form={form}
						name="min_quantity"
						label={m.parts_field_min_quantity()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("min_quantity")}
						error={getFieldError?.("min_quantity")}
					/>
				</div>
			</PanelDetailSection>

			<div className="flex gap-3 mt-5">
				<Button type="button" variant="outline" onClick={onCancel}>
					{m.parts_button_cancel()}
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? m.parts_button_creating() : m.parts_button_create()}
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
