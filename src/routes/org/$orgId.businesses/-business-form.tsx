import { BuildingsIcon } from "@phosphor-icons/react/dist/csr/Buildings";
import { EnvelopeIcon } from "@phosphor-icons/react/dist/csr/Envelope";
import { useForm } from "@tanstack/react-form";
import {
	ImageUploadField,
	ObjectArrayField,
	PhoneArrayField,
	SelectField,
	TextareaField,
	TextField,
} from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { PanelDetailSection } from "@/components/ui/panel-layout";
import type { FieldStatus } from "@/hooks/use-auto-save";
import { useUploadMutation } from "@/lib/queries/upload";
import * as m from "@/paraglide/messages";
import type {
	BusinessCreatePayload,
	BusinessResponse,
	BusinessUpdatePayload,
} from "@/server/domains/businesses/schema";
import { convertToWebP } from "@/utils/image";
import { type BusinessFormValues, DEFAULT_CREATE_VALUES } from "./-types";

type BusinessFormMode = "create" | "edit";

interface BusinessFormProps {
	mode: BusinessFormMode;
	orgId: string;
	activeTab?: string;
	business?: BusinessResponse;
	onAutoSave?: (values: BusinessFormValues) => Promise<void>;
	getFieldStatus?: (fieldName: string) => FieldStatus;
	getFieldError?: (fieldName: string) => string | undefined;
	handleFieldChange?: (fieldName: string) => void;
	onSubmit?: (values: BusinessFormValues) => Promise<void>;
	onCancel?: () => void;
	isSubmitting?: boolean;
}

function typeOptions() {
	return [
		{ value: "customer", label: m.biz_type_customer() },
		{ value: "vendor", label: m.biz_type_vendor() },
		{ value: "both", label: m.biz_type_both() },
	];
}

export function mapBusinessToFormValues(
	business: BusinessResponse,
): BusinessFormValues {
	return {
		name: business.name,
		tax_id: business.tax_id ?? "",
		type: business.type,
		description: business.description ?? "",
		image_url: business.image_url ?? "",
		phones: business.phones ?? [],
		emails: business.emails ?? [],
	};
}

export function buildPartialUpdateRequest(
	values: BusinessFormValues,
	modifiedFields: Set<string>,
): BusinessUpdatePayload {
	const request: BusinessUpdatePayload = {};

	if (modifiedFields.has("name") && values.name) {
		request.name = values.name;
	}
	if (modifiedFields.has("tax_id")) {
		request.tax_id = values.tax_id;
	}
	if (modifiedFields.has("type")) {
		request.type = values.type;
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

	return request;
}

export function mapFormValuesToCreateRequest(
	values: BusinessFormValues,
): BusinessCreatePayload {
	return {
		name: values.name,
		tax_id: values.tax_id || undefined,
		type: values.type,
		description: values.description || undefined,
		image_url: values.image_url || undefined,
		phones: values.phones.length > 0 ? values.phones : undefined,
		emails: values.emails.length > 0 ? values.emails : undefined,
	};
}

export function BusinessForm({
	mode,
	orgId,
	activeTab,
	business,
	onAutoSave,
	getFieldStatus,
	getFieldError,
	handleFieldChange,
	onSubmit,
	onCancel,
	isSubmitting,
}: BusinessFormProps) {
	const isEditMode = mode === "edit";

	const uploadMutation = useUploadMutation();

	const form = useForm({
		defaultValues:
			isEditMode && business
				? mapBusinessToFormValues(business)
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

	if (isEditMode) {
		const tab = activeTab ?? "overview";

		if (tab !== "overview") {
			return null;
		}

		return (
			<div className="space-y-8">
				<PanelDetailSection title={m.biz_section_basic()}>
					<div className="space-y-4">
						<TextField
							form={form}
							name="name"
							label={m.biz_field_name()}
							placeholder={m.biz_placeholder_name()}
							onFieldChange={fieldChangeHandler}
							status={getStatus("name")}
							required
							error={getFieldError?.("name")}
						/>

						<TextField
							form={form}
							name="tax_id"
							label={m.biz_field_tax_id()}
							placeholder={m.biz_placeholder_tax_id()}
							onFieldChange={fieldChangeHandler}
							status={getStatus("tax_id")}
						/>

						<SelectField
							form={form}
							name="type"
							label={m.biz_field_type()}
							options={typeOptions()}
							onFieldChange={fieldChangeHandler}
							status={getStatus("type")}
						/>

						<TextareaField
							form={form}
							name="description"
							label={m.biz_field_description()}
							placeholder={m.biz_placeholder_description()}
							onFieldChange={fieldChangeHandler}
							status={getStatus("description")}
						/>
					</div>
				</PanelDetailSection>

				<PanelDetailSection title={m.biz_section_contact()}>
					<div className="space-y-4">
						<PhoneArrayField
							form={form}
							name="phones"
							label={m.biz_field_phones()}
							addButtonText={m.biz_button_add_phone()}
							prefixPlaceholder={m.biz_phone_prefix()}
							numberPlaceholder={m.biz_placeholder_phone()}
							emptyText={m.biz_no_locations()}
							onFieldChange={fieldChangeHandler}
							status={getStatus("phones")}
						/>

						<ObjectArrayField
							form={form}
							name="emails"
							label={m.biz_field_emails()}
							placeholder={m.biz_placeholder_email()}
							addButtonText={m.biz_button_add_email()}
							icon={EnvelopeIcon}
							inputType="email"
							valueKey="address"
							onFieldChange={fieldChangeHandler}
							status={getStatus("emails")}
						/>
					</div>
				</PanelDetailSection>
			</div>
		);
	}

	const createFormContent = (
		<>
			<PanelDetailSection title={m.biz_field_image()}>
				<ImageUploadField
					form={form}
					fallbackIcon={BuildingsIcon}
					altText="Business"
					isUploading={uploadMutation.isPending}
					onFieldChange={fieldChangeHandler}
					onUpload={async (file) => {
						const webpFile = await convertToWebP(file);
						const result = await uploadMutation.mutateAsync({
							organizationId: orgId,
							file: webpFile,
							folder: "businesses",
						});
						return result.url;
					}}
					status={getStatus("image_url")}
					autoSubmit={false}
				/>
			</PanelDetailSection>

			<PanelDetailSection title={m.biz_section_basic()}>
				<div className="space-y-4">
					<TextField
						form={form}
						name="name"
						label={m.biz_field_name()}
						placeholder={m.biz_placeholder_name()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("name")}
						required
						error={getFieldError?.("name")}
					/>

					<TextField
						form={form}
						name="tax_id"
						label={m.biz_field_tax_id()}
						placeholder={m.biz_placeholder_tax_id()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("tax_id")}
					/>

					<SelectField
						form={form}
						name="type"
						label={m.biz_field_type()}
						options={typeOptions()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("type")}
					/>

					<TextareaField
						form={form}
						name="description"
						label={m.biz_field_description()}
						placeholder={m.biz_placeholder_description()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("description")}
					/>
				</div>
			</PanelDetailSection>

			<PanelDetailSection title={m.biz_section_contact()}>
				<div className="space-y-4">
					<PhoneArrayField
						form={form}
						name="phones"
						label={m.biz_field_phones()}
						addButtonText={m.biz_button_add_phone()}
						prefixPlaceholder={m.biz_phone_prefix()}
						numberPlaceholder={m.biz_placeholder_phone()}
						emptyText={m.biz_no_locations()}
						onFieldChange={fieldChangeHandler}
						status={getStatus("phones")}
					/>

					<ObjectArrayField
						form={form}
						name="emails"
						label={m.biz_field_emails()}
						placeholder={m.biz_placeholder_email()}
						addButtonText={m.biz_button_add_email()}
						icon={EnvelopeIcon}
						inputType="email"
						valueKey="address"
						onFieldChange={fieldChangeHandler}
						status={getStatus("emails")}
					/>
				</div>
			</PanelDetailSection>

			<div className="flex gap-3 mt-5">
				<Button type="button" variant="outline" onClick={onCancel}>
					{m.biz_button_cancel()}
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? m.biz_button_creating() : m.biz_button_create()}
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
