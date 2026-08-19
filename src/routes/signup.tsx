import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/csr/EnvelopeSimple";
import { EyeIcon } from "@phosphor-icons/react/dist/csr/Eye";
import { EyeClosedIcon } from "@phosphor-icons/react/dist/csr/EyeClosed";
import { LockIcon } from "@phosphor-icons/react/dist/csr/Lock";
import { UserIcon } from "@phosphor-icons/react/dist/csr/User";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BrandWordmark } from "@/components/brand";
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
import { useSignupMutation } from "@/lib/queries/auth";
import * as m from "@/paraglide/messages";
import { signupSchema } from "@/server/domains/auth/schema";
import { seo } from "@/utils/seo";

export const Route = createFileRoute("/signup")({
	head: () =>
		seo({
			title: m.auth_signup_seo_title(),
			description: m.auth_signup_seo_description(),
			path: "/signup",
			noindex: true,
		}),
	component: SignupPage,
});

function SignupPage() {
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const signupMutation = useSignupMutation();

	const form = useForm({
		defaultValues: {
			email: "",
			full_name: "",
			password: "",
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		},
		validators: {
			onSubmit: signupSchema,
		},
		onSubmit: async ({ value }) => {
			const response = await signupMutation.mutateAsync({
				...value,
				email: value.email.trim().toLowerCase(),
			});
			if (response.organization_id) {
				navigate({
					to: "/org/$orgId",
					params: { orgId: response.organization_id.toString() },
				});
			}
		},
	});

	return (
		<div className="flex min-h-screen items-center justify-center p-6 font-[450]">
			<div className="flex w-full max-w-xs flex-col gap-8">
				<div className="flex items-center justify-between">
					<Link to="/">
						<BrandWordmark className="text-3xl" />
					</Link>
				</div>

				<div className="flex flex-col gap-8">
					<div className="flex flex-col gap-2">
						<h1 className="text-2xl font-medium tracking-tight text-foreground">
							{m.auth_signup_title()}
						</h1>
						<p className="text-sm font-normal text-muted-foreground/70">
							{m.auth_signup_has_account()}{" "}
							<Link
								to="/login"
								className="text-primary hover:underline inline-flex items-center gap-1 transition-colors"
							>
								{m.auth_signup_login_link()}
								<ArrowRightIcon className="size-4" />
							</Link>
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
							<div className="flex flex-col gap-4">
								<form.Field
									name="full_name"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel
													htmlFor={field.name}
													className="text-sm font-medium"
												>
													{m.auth_signup_field_fullname()}
												</FieldLabel>
												<InputGroup className="h-10">
													<InputGroupAddon align="inline-start">
														<UserIcon className="size-5" weight="duotone" />
													</InputGroupAddon>
													<InputGroupInput
														id={field.name}
														name={field.name}
														type="text"
														placeholder={m.auth_signup_placeholder_fullname()}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														required
													/>
												</InputGroup>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								/>
								<form.Field
									name="email"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel
													htmlFor={field.name}
													className="text-sm font-medium"
												>
													{m.auth_field_email()}
												</FieldLabel>
												<InputGroup className="h-10">
													<InputGroupAddon align="inline-start">
														<EnvelopeSimpleIcon
															className="size-5"
															weight="duotone"
														/>
													</InputGroupAddon>
													<InputGroupInput
														id={field.name}
														name={field.name}
														type="email"
														placeholder={m.auth_placeholder_email()}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														required
													/>
												</InputGroup>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								/>
								<form.Field
									name="password"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel
													htmlFor={field.name}
													className="text-sm font-medium"
												>
													{m.auth_field_password()}
												</FieldLabel>
												<InputGroup className="h-10">
													<InputGroupAddon>
														<LockIcon className="size-5" weight="duotone" />
													</InputGroupAddon>
													<InputGroupInput
														id={field.name}
														name={field.name}
														type={showPassword ? "text" : "password"}
														placeholder={m.auth_signup_placeholder_password()}
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
							</div>

							{signupMutation.isError && (
								<Alert variant="destructive">
									<WarningCircleIcon weight="duotone" />
									<AlertTitle>
										{signupMutation.error?.message || m.auth_error_generic()}
									</AlertTitle>
								</Alert>
							)}

							<Field>
								<Button
									type="submit"
									size="xl"
									disabled={signupMutation.isPending}
								>
									{signupMutation.isPending ? (
										<Spinner />
									) : (
										m.auth_signup_button()
									)}
								</Button>
							</Field>
						</FieldGroup>
					</form>

					<p className="text-muted-foreground font-normal text-xs leading-relaxed">
						{m.auth_signup_agree()}{" "}
						<Link to="/terms" className="underline hover:text-foreground">
							{m.auth_terms()}
						</Link>{" "}
						and{" "}
						<Link to="/privacy" className="underline hover:text-foreground">
							{m.auth_privacy()}
						</Link>
						.
					</p>
				</div>
			</div>
		</div>
	);
}
