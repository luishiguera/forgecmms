import { BuildingsIcon } from "@phosphor-icons/react/dist/csr/Buildings";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import {
	CountrySelectField,
	PhoneField,
	TextField,
} from "@/components/shared/form-fields";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { FieldStatusIndicator } from "@/components/ui/field-status-indicator";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
	PanelDetail,
	PanelDetailContent,
	PanelDetailField,
	PanelDetailHeader,
	PanelDetailSection,
} from "@/components/ui/panel-layout";
import { Spinner } from "@/components/ui/spinner";
import { useAutoSave } from "@/hooks/use-auto-save";
import {
	organizationQueryOptions,
	useUpdateOrganizationMutation,
} from "@/lib/queries/organization";
import { useUploadMutation } from "@/lib/queries/upload";
import * as m from "@/paraglide/messages";
import type { OrganizationResponse } from "@/server/domains/organizations/schema";
import { formatDate } from "@/utils/format-date";
import { convertToWebP } from "@/utils/image";

type Organization = OrganizationResponse & {
	created_at?: string;
};

export const Route = createFileRoute("/org/$orgId/settings/organization")({
	component: OrganizationPage,
});

function OrganizationPage() {
	const { orgId } = Route.useParams();
	const { data: organization, isLoading } = useQuery(
		organizationQueryOptions(orgId),
	);

	if (isLoading || !organization) {
		return (
			<PanelDetail>
				<PanelDetailHeader title={m.org_title()} subtitle={m.org_subtitle()} />
				<PanelDetailContent>
					<div className="flex items-center justify-center py-12">
						<Spinner className="size-6" />
					</div>
				</PanelDetailContent>
			</PanelDetail>
		);
	}

	return <OrganizationContent organization={organization as Organization} />;
}

function OrganizationContent({ organization }: { organization: Organization }) {
	const { orgId } = Route.useParams();

	const updateOrganizationMutation = useUpdateOrganizationMutation(orgId);
	const uploadMutation = useUploadMutation();

	const logoInputRef = useRef<HTMLInputElement>(null);

	const { getFieldStatus, getFieldError, handleFieldChange, modifiedFields } =
		useAutoSave({
			isPending: updateOrganizationMutation.isPending,
			isSuccess: updateOrganizationMutation.isSuccess,
			isError: updateOrganizationMutation.isError,
			error: updateOrganizationMutation.error,
		});

	const organizationForm = useForm({
		defaultValues: {
			name: organization.name,
			legal_name: organization.legal_name ?? "",
			tax_id: organization.tax_id ?? "",
			address: organization.address ?? "",
			city: organization.city ?? "",
			state: organization.state ?? "",
			postal_code: organization.postal_code ?? "",
			country: organization.country ?? "",
			email: organization.email ?? "",
			phone: organization.phone ?? "",
		},
		listeners: {
			onChange: ({ formApi }) => {
				if (formApi.state.isValid && formApi.state.isDirty) {
					formApi.handleSubmit();
				}
			},
			onChangeDebounceMs: 400,
		},
		onSubmit: async ({ value }) => {
			const payload = Object.fromEntries(
				Object.entries(value).filter(([key]) => modifiedFields.has(key)),
			) as Partial<typeof value>;
			if (Object.keys(payload).length === 0) return;
			await updateOrganizationMutation.mutateAsync(payload);
		},
	});

	const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const webpFile = await convertToWebP(file);
		const result = await uploadMutation.mutateAsync({
			organizationId: orgId,
			file: webpFile,
			folder: "avatars",
		});
		await new Promise<void>((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve();
			img.onerror = () => reject();
			img.src = result.url;
		});
		handleFieldChange("logo_url");
		await updateOrganizationMutation.mutateAsync({ logo_url: result.url });
	};

	return (
		<PanelDetail>
			<PanelDetailHeader title={m.org_title()} subtitle={m.org_subtitle()} />

			<PanelDetailContent>
				<PanelDetailSection title={m.org_section_profile()}>
					<div className="space-y-4">
						<PanelDetailField
							label={m.org_field_logo()}
							action={
								<FieldStatusIndicator status={getFieldStatus("logo_url")} />
							}
						>
							<Avatar className="size-20">
								{uploadMutation.isPending ? (
									<AvatarFallback>
										<Spinner className="size-5" />
									</AvatarFallback>
								) : (
									<>
										<AvatarImage
											src={organization.logo_url ?? undefined}
											alt="Organization logo"
										/>
										<AvatarFallback>
											<BuildingsIcon
												className="size-8 text-muted-foreground"
												weight="duotone"
											/>
										</AvatarFallback>
									</>
								)}
							</Avatar>
							<input
								ref={logoInputRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={handleLogoUpload}
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="mt-2"
								onClick={() => logoInputRef.current?.click()}
								disabled={uploadMutation.isPending}
							>
								{uploadMutation.isPending
									? m.org_button_uploading()
									: m.org_button_upload()}
							</Button>
							{uploadMutation.isError && (
								<Alert variant="destructive" className="mt-2">
									<WarningCircleIcon weight="duotone" />
									<AlertTitle>
										{uploadMutation.error?.message || m.org_error_upload()}
									</AlertTitle>
								</Alert>
							)}
						</PanelDetailField>

						<organizationForm.Field
							name="name"
							children={(field) => (
								<Field>
									<FieldLabel className="flex items-center gap-1.5">
										{m.org_field_name()}
										<FieldStatusIndicator status={getFieldStatus("name")} />
									</FieldLabel>
									<InputGroup>
										<InputGroupInput
											value={field.state.value}
											onChange={(e) => {
												field.handleChange(e.target.value);
												handleFieldChange("name");
											}}
											placeholder={m.org_placeholder_name()}
										/>
									</InputGroup>
									<FieldError>{getFieldError("name")}</FieldError>
								</Field>
							)}
						/>

						<PanelDetailField label={m.org_field_id()}>
							<code className="text-sm bg-muted px-2 py-1 rounded">
								{organization.id}
							</code>
						</PanelDetailField>

						<PanelDetailField label={m.org_field_created()}>
							<span className="text-sm text-muted-foreground">
								{organization.created_at
									? formatDate(organization.created_at, { style: "long" })
									: "-"}
							</span>
						</PanelDetailField>
					</div>
				</PanelDetailSection>

				<PanelDetailSection title={m.org_section_fiscal()}>
					<div className="space-y-4">
						<TextField
							form={organizationForm}
							name="legal_name"
							label={m.org_field_legal_name()}
							placeholder={m.org_placeholder_legal_name()}
							status={getFieldStatus("legal_name")}
							error={getFieldError("legal_name")}
							onFieldChange={handleFieldChange}
						/>
						<TextField
							form={organizationForm}
							name="tax_id"
							label={m.org_field_tax_id()}
							placeholder={m.org_placeholder_tax_id()}
							status={getFieldStatus("tax_id")}
							error={getFieldError("tax_id")}
							onFieldChange={handleFieldChange}
						/>
						<TextField
							form={organizationForm}
							name="email"
							label={m.org_field_email()}
							placeholder={m.org_placeholder_email()}
							status={getFieldStatus("email")}
							error={getFieldError("email")}
							onFieldChange={handleFieldChange}
						/>
						<PhoneField
							form={organizationForm}
							name="phone"
							label={m.org_field_phone()}
							prefixPlaceholder={m.org_phone_prefix()}
							numberPlaceholder={m.org_placeholder_phone()}
							emptyText={m.org_empty_country()}
							status={getFieldStatus("phone")}
							error={getFieldError("phone")}
							onFieldChange={handleFieldChange}
						/>
						<TextField
							form={organizationForm}
							name="address"
							label={m.org_field_address()}
							placeholder={m.org_placeholder_address()}
							status={getFieldStatus("address")}
							error={getFieldError("address")}
							onFieldChange={handleFieldChange}
						/>
						<TextField
							form={organizationForm}
							name="city"
							label={m.org_field_city()}
							placeholder={m.org_placeholder_city()}
							status={getFieldStatus("city")}
							error={getFieldError("city")}
							onFieldChange={handleFieldChange}
						/>
						<TextField
							form={organizationForm}
							name="state"
							label={m.org_field_state()}
							placeholder={m.org_placeholder_state()}
							status={getFieldStatus("state")}
							error={getFieldError("state")}
							onFieldChange={handleFieldChange}
						/>
						<TextField
							form={organizationForm}
							name="postal_code"
							label={m.org_field_postal_code()}
							placeholder={m.org_placeholder_postal_code()}
							status={getFieldStatus("postal_code")}
							error={getFieldError("postal_code")}
							onFieldChange={handleFieldChange}
						/>
						<CountrySelectField
							form={organizationForm}
							name="country"
							label={m.org_field_country()}
							placeholder={m.org_placeholder_country()}
							emptyText={m.org_empty_country()}
							status={getFieldStatus("country")}
							error={getFieldError("country")}
							onFieldChange={handleFieldChange}
						/>
					</div>
				</PanelDetailSection>
			</PanelDetailContent>
		</PanelDetail>
	);
}
