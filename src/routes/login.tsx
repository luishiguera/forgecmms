import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/csr/EnvelopeSimple";
import { EyeIcon } from "@phosphor-icons/react/dist/csr/Eye";
import { EyeClosedIcon } from "@phosphor-icons/react/dist/csr/EyeClosed";
import { LockIcon } from "@phosphor-icons/react/dist/csr/Lock";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
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
import { useLoginMutation } from "@/lib/queries/auth";
import * as m from "@/paraglide/messages";
import { loginSchema } from "@/server/domains/auth/schema";
import { listMyOrganizations } from "@/server/domains/organizations/fn";
import { isAppError } from "@/server/errors";
import { seo } from "@/utils/seo";

const searchSchema = z.object({
	redirect: z
		.string()
		.regex(/^\/(?![/\\])/)
		.optional()
		.catch(undefined),
});

export const Route = createFileRoute("/login")({
	head: () =>
		seo({
			title: m.auth_login_seo_title(),
			description: m.auth_login_seo_description(),
			path: "/login",
			noindex: true,
		}),
	validateSearch: searchSchema,
	beforeLoad: async () => {
		const signedIn = await listMyOrganizations()
			.then(() => true)
			.catch(() => false);
		if (signedIn) throw redirect({ to: "/select-organization" });
	},
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const { redirect: redirectTo } = Route.useSearch();
	const [showPassword, setShowPassword] = useState(false);
	const loginMutation = useLoginMutation();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onSubmit: loginSchema,
		},
		onSubmit: async ({ value }) => {
			const response = await loginMutation.mutateAsync({
				...value,
				email: value.email.trim().toLowerCase(),
			});
			if (redirectTo) {
				navigate({ href: redirectTo });
				return;
			}

			const orgs = response.organizations || [];

			if (orgs.length === 1) {
				navigate({
					to: orgs[0].accesses.includes("backoffice")
						? "/org/$orgId"
						: "/app/$orgId",
					params: { orgId: orgs[0].id!.toString() },
				});
			} else {
				navigate({ to: "/select-organization" });
			}
		},
	});

	return (
		<div className="flex min-h-screen items-center justify-center p-6 font-[450]">
			<div className="flex w-full max-w-xs flex-col gap-8">
				<div className="flex items-center justify-between">
					<Link to="/">
						<BrandWordmark />
					</Link>
				</div>

				<div className="flex flex-col gap-8">
					<div className="flex flex-col gap-2">
						<h1 className="text-2xl font-medium tracking-tight text-foreground">
							{m.auth_login_title()}
						</h1>
						<p className="text-sm font-normal text-muted-foreground/70">
							{m.auth_login_no_account()}{" "}
							<Link
								to="/signup"
								className="text-primary hover:underline inline-flex items-center gap-1 transition-colors"
							>
								{m.auth_login_signup_link()}
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
											<div className="flex items-center justify-between">
												<FieldLabel
													htmlFor={field.name}
													className="text-sm font-medium"
												>
													{m.auth_field_password()}
												</FieldLabel>
												<Link
													to="/forgot-password"
													className="text-xs text-muted-foreground hover:text-foreground transition-colors"
												>
													{m.auth_login_forgot_password()}
												</Link>
											</div>
											<InputGroup className="h-10">
												<InputGroupAddon>
													<LockIcon className="size-5" weight="duotone" />
												</InputGroupAddon>
												<InputGroupInput
													id={field.name}
													name={field.name}
													type={showPassword ? "text" : "password"}
													placeholder={m.auth_placeholder_password()}
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

							{loginMutation.isError && (
								<Alert variant="destructive">
									<WarningCircleIcon weight="duotone" />
									<AlertTitle>
										{isAppError(loginMutation.error, "invalid_credentials")
											? m.auth_error_invalid_credentials()
											: m.auth_error_generic()}
									</AlertTitle>
								</Alert>
							)}

							<Field>
								<Button
									type="submit"
									size="xl"
									disabled={loginMutation.isPending}
								>
									{loginMutation.isPending ? (
										<Spinner />
									) : (
										m.auth_login_button()
									)}
								</Button>
							</Field>
						</FieldGroup>
					</form>

					<p className="text-muted-foreground font-normal text-xs leading-relaxed">
						{m.auth_login_agree()}{" "}
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
