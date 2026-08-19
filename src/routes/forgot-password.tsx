import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/csr/EnvelopeSimple";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/csr/PaperPlaneTilt";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
	InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { useForgotPasswordMutation } from "@/lib/queries/auth";
import * as m from "@/paraglide/messages";
import { forgotPasswordSchema } from "@/server/domains/auth/schema";
import { seo } from "@/utils/seo";

export const Route = createFileRoute("/forgot-password")({
	head: () =>
		seo({
			title: m.auth_forgot_seo_title(),
			description: m.auth_forgot_seo_description(),
			path: "/forgot-password",
			noindex: true,
		}),
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [submittedEmail, setSubmittedEmail] = useState("");
	const forgotPasswordMutation = useForgotPasswordMutation();

	const form = useForm({
		defaultValues: {
			email: "",
		},
		validators: {
			onSubmit: forgotPasswordSchema,
		},
		onSubmit: async ({ value }) => {
			const email = value.email.trim().toLowerCase();
			await forgotPasswordMutation.mutateAsync({ ...value, email });
			setSubmittedEmail(email);
			setIsSubmitted(true);
		},
	});

	if (isSubmitted) {
		return (
			<div className="flex min-h-screen items-center justify-center p-6 font-[450]">
				<div className="flex w-full max-w-xs flex-col gap-8">
					<div className="flex flex-col gap-6">
						<div className="flex flex-col items-center gap-4 text-center">
							<div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
								<PaperPlaneTiltIcon
									className="size-8 text-emerald-600"
									weight="duotone"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<h1 className="text-2xl font-medium tracking-tight text-foreground">
									{m.auth_forgot_success_title()}
								</h1>
								<p className="text-sm font-normal text-muted-foreground/70">
									{m.auth_forgot_success_description()}{" "}
									<span className="font-medium text-foreground">
										{submittedEmail}
									</span>
								</p>
							</div>
						</div>

						<div className="flex flex-col gap-3">
							<p className="text-xs text-muted-foreground text-center">
								{m.auth_forgot_success_hint()}{" "}
								<button
									type="button"
									onClick={() => setIsSubmitted(false)}
									className="text-primary hover:underline"
								>
									{m.auth_forgot_success_retry()}
								</button>
							</p>
						</div>

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
							{m.auth_forgot_title()}
						</h1>
						<p className="text-sm font-normal text-muted-foreground/70">
							{m.auth_forgot_subtitle()}
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

							{forgotPasswordMutation.isError && (
								<Alert variant="destructive">
									<WarningCircleIcon weight="duotone" />
									<AlertTitle>
										{forgotPasswordMutation.error?.message ||
											m.auth_error_generic()}
									</AlertTitle>
								</Alert>
							)}

							<Field>
								<Button
									type="submit"
									size="xl"
									disabled={forgotPasswordMutation.isPending}
								>
									{forgotPasswordMutation.isPending ? (
										<Spinner />
									) : (
										m.auth_forgot_button()
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
