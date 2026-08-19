import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { EyeIcon } from "@phosphor-icons/react/dist/csr/Eye";
import { EyeClosedIcon } from "@phosphor-icons/react/dist/csr/EyeClosed";
import { LockIcon } from "@phosphor-icons/react/dist/csr/Lock";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { useResetPasswordMutation } from "@/lib/queries/auth";
import * as m from "@/paraglide/messages";
import { resetPasswordSchema } from "@/server/domains/auth/schema";
import { seo } from "@/utils/seo";

const searchSchema = z.object({
	token: z.string().optional(),
});

const resetPasswordFormSchema = resetPasswordSchema
	.omit({ token: true })
	.extend({
		confirm_password: z.string().min(6).max(128),
	})
	.refine((data) => data.new_password === data.confirm_password, {
		message: m.auth_reset_passwords_mismatch(),
		path: ["confirm_password"],
	});

export const Route = createFileRoute("/reset-password")({
	validateSearch: searchSchema,
	head: () =>
		seo({
			title: m.auth_reset_seo_title(),
			description: m.auth_reset_seo_description(),
			path: "/reset-password",
			noindex: true,
		}),
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const navigate = useNavigate();
	const { token } = Route.useSearch();
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const resetPasswordMutation = useResetPasswordMutation();

	const form = useForm({
		defaultValues: {
			new_password: "",
			confirm_password: "",
		},
		validators: {
			onSubmit: resetPasswordFormSchema,
		},
		onSubmit: async ({ value }) => {
			if (!token) return;
			await resetPasswordMutation.mutateAsync({
				token,
				new_password: value.new_password,
			});
			setIsSubmitted(true);
		},
	});

	if (!token) {
		return (
			<div className="flex min-h-screen items-center justify-center p-6 font-[450]">
				<div className="flex w-full max-w-xs flex-col gap-8">
					<div className="flex flex-col gap-6">
						<div className="flex flex-col items-center gap-4 text-center">
							<div className="flex size-16 items-center justify-center rounded-full bg-red-500/10">
								<WarningCircleIcon
									className="size-8 text-red-600"
									weight="duotone"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<h1 className="text-2xl font-medium tracking-tight text-foreground">
									{m.auth_reset_invalid_title()}
								</h1>
								<p className="text-sm font-normal text-muted-foreground/70">
									{m.auth_reset_invalid_description()}
								</p>
							</div>
						</div>

						<Link to="/forgot-password">
							<Button size="xl" className="w-full">
								{m.auth_reset_request_new()}
							</Button>
						</Link>

						<Link
							to="/login"
							className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-2 transition-colors"
						>
							<ArrowLeftIcon className="size-4" />
							{m.auth_back_to_login()}
						</Link>
					</div>
				</div>
			</div>
		);
	}

	if (isSubmitted) {
		return (
			<div className="flex min-h-screen items-center justify-center p-6 font-[450]">
				<div className="flex w-full max-w-xs flex-col gap-8">
					<div className="flex flex-col gap-6">
						<div className="flex flex-col items-center gap-4 text-center">
							<div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
								<CheckCircleIcon
									className="size-8 text-emerald-600"
									weight="duotone"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<h1 className="text-2xl font-medium tracking-tight text-foreground">
									{m.auth_reset_success_title()}
								</h1>
								<p className="text-sm font-normal text-muted-foreground/70">
									{m.auth_reset_success_description()}
								</p>
							</div>
						</div>

						<Button
							size="xl"
							onClick={() => navigate({ to: "/login" })}
							className="w-full"
						>
							{m.auth_reset_continue_login()}
							<ArrowRightIcon className="size-4" />
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-6 font-[450]">
			<div className="flex w-full max-w-xs flex-col gap-8">
				<div className="flex items-center justify-between">
					<Link to="/">
						<span className="font-logo text-3xl">forgecmms</span>
					</Link>
				</div>

				<div className="flex flex-col gap-8">
					<div className="flex flex-col gap-2">
						<h1 className="text-2xl font-medium tracking-tight text-foreground">
							{m.auth_reset_title()}
						</h1>
						<p className="text-sm font-normal text-muted-foreground/70">
							{m.auth_reset_subtitle()}
						</p>
					</div>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
						className="flex flex-col gap-4"
					>
						<FieldGroup>
							<form.Field
								name="new_password"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel
												htmlFor={field.name}
												className="text-sm font-medium"
											>
												{m.auth_reset_field_new()}
											</FieldLabel>
											<InputGroup className="h-10">
												<InputGroupAddon>
													<LockIcon className="size-5" weight="duotone" />
												</InputGroupAddon>
												<InputGroupInput
													id={field.name}
													name={field.name}
													type={showPassword ? "text" : "password"}
													placeholder={m.auth_reset_placeholder_new()}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													minLength={6}
													required
												/>
												<InputGroupAddon align="inline-end" className="pr-3">
													<InputGroupButton
														type="button"
														variant="ghost"
														size="icon-xs"
														onClick={() => setShowPassword(!showPassword)}
														aria-label={
															showPassword
																? m.auth_hide_password()
																: m.auth_show_password()
														}
													>
														{showPassword ? (
															<EyeIcon className="size-5" weight="duotone" />
														) : (
															<EyeClosedIcon
																className="size-5"
																weight="duotone"
															/>
														)}
													</InputGroupButton>
												</InputGroupAddon>
											</InputGroup>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									);
								}}
							/>

							<form.Field
								name="confirm_password"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel
												htmlFor={field.name}
												className="text-sm font-medium"
											>
												{m.auth_reset_field_confirm()}
											</FieldLabel>
											<InputGroup className="h-10">
												<InputGroupAddon>
													<LockIcon className="size-5" weight="duotone" />
												</InputGroupAddon>
												<InputGroupInput
													id={field.name}
													name={field.name}
													type={showConfirmPassword ? "text" : "password"}
													placeholder={m.auth_reset_placeholder_confirm()}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													minLength={6}
													required
												/>
												<InputGroupAddon align="inline-end" className="pr-3">
													<InputGroupButton
														type="button"
														variant="ghost"
														size="icon-xs"
														onClick={() =>
															setShowConfirmPassword(!showConfirmPassword)
														}
														aria-label={
															showConfirmPassword
																? m.auth_hide_password()
																: m.auth_show_password()
														}
													>
														{showConfirmPassword ? (
															<EyeIcon className="size-5" weight="duotone" />
														) : (
															<EyeClosedIcon
																className="size-5"
																weight="duotone"
															/>
														)}
													</InputGroupButton>
												</InputGroupAddon>
											</InputGroup>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									);
								}}
							/>

							{resetPasswordMutation.isError && (
								<Alert variant="destructive">
									<WarningCircleIcon weight="duotone" />
									<AlertTitle>
										{resetPasswordMutation.error?.message ||
											m.auth_error_generic()}
									</AlertTitle>
								</Alert>
							)}

							<Field>
								<Button
									type="submit"
									size="xl"
									disabled={resetPasswordMutation.isPending}
								>
									{resetPasswordMutation.isPending ? (
										<Spinner />
									) : (
										m.auth_reset_button()
									)}
								</Button>
							</Field>
						</FieldGroup>
					</form>

					<Link
						to="/login"
						className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-2 transition-colors"
					>
						<ArrowLeftIcon className="size-4" />
						{m.auth_back_to_login()}
					</Link>
				</div>
			</div>
		</div>
	);
}
