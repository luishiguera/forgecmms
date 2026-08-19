import { EyeIcon } from "@phosphor-icons/react/dist/csr/Eye";
import { EyeSlashIcon } from "@phosphor-icons/react/dist/csr/EyeSlash";
import { UserCircleIcon } from "@phosphor-icons/react/dist/csr/UserCircle";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { z } from "zod";
import { SelectField } from "@/components/shared/form-fields";
import { MyWorkingHours } from "@/components/shared/my-working-hours";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
	InputGroup,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	PanelDetail,
	PanelDetailContent,
	PanelDetailField,
	PanelDetailHeader,
	PanelDetailSection,
} from "@/components/ui/panel-layout";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useAutoSave } from "@/hooks/use-auto-save";
import { LANGUAGES, type Language } from "@/lib/languages";
import { useChangePasswordMutation } from "@/lib/queries/auth";
import { useProfilePhoto } from "@/lib/queries/profile-photo";
import { meQueryOptions, useUpdateProfileMutation } from "@/lib/queries/user";
import { setUse24hFormat, useTimeFormat } from "@/lib/time-format";
import * as m from "@/paraglide/messages";
import { setLocale } from "@/paraglide/runtime";
import { changePasswordSchema } from "@/server/domains/auth/schema";
import type { UserResponse } from "@/server/domains/users/schema";
import { formatDate } from "@/utils/format-date";

const timezones = Intl.supportedValuesOf("timeZone");

export const Route = createFileRoute("/org/$orgId/settings/profile")({
	component: ProfilePage,
});

function ProfilePage() {
	const { data: currentUser, isLoading } = useQuery(meQueryOptions());

	if (isLoading || !currentUser) {
		return (
			<PanelDetail>
				<PanelDetailHeader
					title={m.profile_title()}
					subtitle={m.profile_subtitle()}
				/>
				<PanelDetailContent>
					<div className="flex items-center justify-center py-12">
						<Spinner className="size-6" />
					</div>
				</PanelDetailContent>
			</PanelDetail>
		);
	}

	return <ProfileContent currentUser={currentUser} />;
}

function ProfileContent({ currentUser }: { currentUser: UserResponse }) {
	const { orgId } = Route.useParams();
	const navigate = useNavigate();

	const updateProfileMutation = useUpdateProfileMutation();
	const changePasswordMutation = useChangePasswordMutation();

	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const use24h = useTimeFormat();

	const photoInputRef = useRef<HTMLInputElement>(null);

	const { getFieldStatus, getFieldError, handleFieldChange } = useAutoSave({
		isPending: updateProfileMutation.isPending,
		isSuccess: updateProfileMutation.isSuccess,
		isError: updateProfileMutation.isError,
		error: updateProfileMutation.error,
	});

	const profileForm = useForm({
		defaultValues: {
			full_name: currentUser.full_name ?? "",
			language: (currentUser.language ?? "en-US") as Language,
			timezone: currentUser.timezone ?? "",
		},
		listeners: {
			onChange: ({ formApi }) => {
				if (formApi.state.isValid) {
					formApi.handleSubmit();
				}
			},
			onChangeDebounceMs: 400,
		},
		onSubmit: async ({ value }) => {
			const { timezone, ...rest } = value;
			const payload = timezone ? { ...rest, timezone } : rest;
			await updateProfileMutation.mutateAsync(payload);
			if (value.language !== currentUser.language) {
				setLocale(value.language);
			}
		},
	});

	const passwordFormSchema = changePasswordSchema.extend({
		confirm_password: z.string(),
	});

	const passwordForm = useForm({
		defaultValues: {
			current_password: "",
			new_password: "",
			confirm_password: "",
		},
		validators: {
			onSubmit: passwordFormSchema,
		},
		onSubmit: async ({ value }) => {
			await changePasswordMutation.mutateAsync({
				current_password: value.current_password,
				new_password: value.new_password,
			});
			navigate({ to: "/login" });
		},
	});

	const photo = useProfilePhoto(orgId, () => handleFieldChange("photo_url"));

	const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) await photo.upload(file);
	};

	return (
		<PanelDetail>
			<PanelDetailHeader
				title={m.profile_title()}
				subtitle={m.profile_subtitle()}
			/>

			<PanelDetailContent>
				<PanelDetailSection title={m.profile_section_profile()}>
					<div className="space-y-4">
						<PanelDetailField
							label={m.profile_field_photo()}
							action={
								<FieldStatusIndicator status={getFieldStatus("photo_url")} />
							}
						>
							<Avatar className="size-20">
								{photo.isUploading ? (
									<AvatarFallback>
										<Spinner className="size-5" />
									</AvatarFallback>
								) : (
									<>
										<AvatarImage
											src={currentUser.photo_url ?? undefined}
											alt="Profile photo"
										/>
										<AvatarFallback>
											<UserCircleIcon
												className="size-8 text-muted-foreground"
												weight="duotone"
											/>
										</AvatarFallback>
									</>
								)}
							</Avatar>
							<input
								ref={photoInputRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={handlePhotoUpload}
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="mt-2"
								onClick={() => photoInputRef.current?.click()}
								disabled={photo.isUploading}
							>
								{photo.isUploading
									? m.profile_button_uploading()
									: m.profile_button_upload()}
							</Button>
							{!!photo.error && (
								<Alert variant="destructive" className="mt-2">
									<WarningCircleIcon weight="duotone" />
									<AlertTitle>
										{photo.error?.message || m.profile_error_upload()}
									</AlertTitle>
								</Alert>
							)}
						</PanelDetailField>

						<profileForm.Field
							name="full_name"
							children={(field) => (
								<Field>
									<FieldLabel className="flex items-center gap-1.5">
										{m.profile_field_fullname()}
										<FieldStatusIndicator
											status={getFieldStatus("full_name")}
										/>
									</FieldLabel>
									<InputGroup>
										<InputGroupInput
											value={field.state.value ?? ""}
											onChange={(e) => {
												field.handleChange(e.target.value);
												handleFieldChange("full_name");
											}}
											placeholder={m.profile_placeholder_fullname()}
										/>
									</InputGroup>
									<FieldError>{getFieldError("full_name")}</FieldError>
								</Field>
							)}
						/>

						<Field>
							<FieldLabel>{m.profile_field_email()}</FieldLabel>
							<InputGroup>
								<InputGroupInput
									type="email"
									value={currentUser.email}
									disabled
									className="bg-muted/50 cursor-not-allowed"
								/>
							</InputGroup>
						</Field>

						<SelectField
							form={profileForm}
							name="language"
							label={m.profile_field_language()}
							options={LANGUAGES}
							status={getFieldStatus("language")}
							onFieldChange={handleFieldChange}
							error={getFieldError("language")}
						/>

						<profileForm.Field
							name="timezone"
							children={(field) => (
								<Field>
									<FieldLabel className="flex items-center gap-1.5">
										{m.profile_field_timezone()}
										<FieldStatusIndicator status={getFieldStatus("timezone")} />
									</FieldLabel>
									<Combobox
										value={field.state.value}
										onValueChange={(value) => {
											if (value) {
												field.handleChange(value);
												handleFieldChange("timezone");
											}
										}}
										items={timezones}
										filter={(item, search) =>
											item
												.toLowerCase()
												.replace(/_/g, " ")
												.includes(search.toLowerCase())
										}
									>
										<ComboboxInput
											placeholder={m.profile_placeholder_timezone()}
										/>
										<ComboboxContent>
											<ComboboxList>
												{(tz) => (
													<ComboboxItem key={tz} value={tz}>
														{tz.replace(/_/g, " ")}
													</ComboboxItem>
												)}
											</ComboboxList>
											<ComboboxEmpty>
												{m.profile_empty_timezone()}
											</ComboboxEmpty>
										</ComboboxContent>
									</Combobox>
									<FieldError>{getFieldError("timezone")}</FieldError>
								</Field>
							)}
						/>

						<PanelDetailField label={m.profile_field_time_format()}>
							<div className="flex items-center justify-between gap-4">
								<span className="text-sm text-muted-foreground">
									{m.profile_time_format_24h()}
								</span>
								<Switch checked={use24h} onCheckedChange={setUse24hFormat} />
							</div>
						</PanelDetailField>

						<PanelDetailField label={m.profile_field_membersince()}>
							<span className="text-sm text-muted-foreground">
								{currentUser.created_at
									? formatDate(currentUser.created_at, { style: "long" })
									: "-"}
							</span>
						</PanelDetailField>
					</div>
				</PanelDetailSection>

				<PanelDetailSection title={m.profile_section_security()}>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							passwordForm.handleSubmit();
						}}
						className="space-y-4"
					>
						{changePasswordMutation.isError && (
							<Alert variant="destructive">
								<WarningCircleIcon weight="duotone" />
								<AlertTitle>
									{changePasswordMutation.error?.message ||
										m.profile_error_generic()}
								</AlertTitle>
							</Alert>
						)}

						<passwordForm.Field
							name="current_password"
							children={(field) => (
								<Field>
									<FieldLabel>{m.profile_field_current_password()}</FieldLabel>
									<InputGroup>
										<InputGroupInput
											type={showCurrentPassword ? "text" : "password"}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											placeholder={m.profile_placeholder_current_password()}
										/>
										<InputGroupButton
											type="button"
											variant="ghost"
											size="icon-xs"
											onClick={() =>
												setShowCurrentPassword(!showCurrentPassword)
											}
										>
											{showCurrentPassword ? (
												<EyeSlashIcon className="size-4" />
											) : (
												<EyeIcon className="size-4" />
											)}
										</InputGroupButton>
									</InputGroup>
								</Field>
							)}
						/>

						<passwordForm.Field
							name="new_password"
							children={(field) => (
								<Field>
									<FieldLabel>{m.profile_field_new_password()}</FieldLabel>
									<InputGroup>
										<InputGroupInput
											type={showNewPassword ? "text" : "password"}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											placeholder={m.profile_placeholder_new_password()}
										/>
										<InputGroupButton
											type="button"
											variant="ghost"
											size="icon-xs"
											onClick={() => setShowNewPassword(!showNewPassword)}
										>
											{showNewPassword ? (
												<EyeSlashIcon className="size-4" />
											) : (
												<EyeIcon className="size-4" />
											)}
										</InputGroupButton>
									</InputGroup>
								</Field>
							)}
						/>

						<passwordForm.Field
							name="confirm_password"
							validators={{
								onChangeListenTo: ["new_password"],
								onChange: ({ value, fieldApi }) => {
									const newPassword =
										fieldApi.form.getFieldValue("new_password");
									if (value.length > 0 && value !== newPassword) {
										return m.profile_error_passwords_match();
									}
									return undefined;
								},
							}}
							children={(field) => {
								const hasError =
									field.state.meta.isTouched &&
									field.state.meta.errors.length > 0;
								return (
									<Field data-invalid={hasError}>
										<FieldLabel>
											{m.profile_field_confirm_password()}
										</FieldLabel>
										<InputGroup>
											<InputGroupInput
												type={showConfirmPassword ? "text" : "password"}
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												placeholder={m.profile_placeholder_confirm_password()}
												aria-invalid={hasError}
											/>
											<InputGroupButton
												type="button"
												variant="ghost"
												size="icon-xs"
												onClick={() =>
													setShowConfirmPassword(!showConfirmPassword)
												}
											>
												{showConfirmPassword ? (
													<EyeSlashIcon className="size-4" />
												) : (
													<EyeIcon className="size-4" />
												)}
											</InputGroupButton>
										</InputGroup>
										{hasError && (
											<FieldError>
												{String(field.state.meta.errors[0])}
											</FieldError>
										)}
									</Field>
								);
							}}
						/>

						<div className="pt-2">
							<Button type="submit" disabled={changePasswordMutation.isPending}>
								{changePasswordMutation.isPending
									? m.profile_button_changing()
									: m.profile_button_change_password()}
							</Button>
						</div>
					</form>
				</PanelDetailSection>

				<PanelDetailSection title={m.hours_section()}>
					<MyWorkingHours orgId={orgId} userId={currentUser.id} />
				</PanelDetailSection>
			</PanelDetailContent>
		</PanelDetail>
	);
}
