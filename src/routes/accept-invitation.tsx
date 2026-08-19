import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { BuildingsIcon } from "@phosphor-icons/react/dist/csr/Buildings";
import { EyeIcon } from "@phosphor-icons/react/dist/csr/Eye";
import { EyeClosedIcon } from "@phosphor-icons/react/dist/csr/EyeClosed";
import { LockIcon } from "@phosphor-icons/react/dist/csr/Lock";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useMountEffect } from "@/hooks/use-mount-effect";
import {
	useAcceptInvitationMutation,
	useInvitationDetailsQuery,
} from "@/lib/queries/invitation";
import * as m from "@/paraglide/messages";
import type { InvitationDetailsResponse } from "@/server/domains/invitations/schema";
import { seo } from "@/utils/seo";

const searchSchema = z.object({
	token: z.string().optional(),
});

const homeRoute = (invitation: InvitationDetailsResponse) =>
	invitation.accesses?.includes("backoffice") ? "/org/$orgId" : "/app/$orgId";

const acceptInvitationFormSchema = z.object({
	password: z.string().min(6).max(128),
});

export const Route = createFileRoute("/accept-invitation")({
	validateSearch: searchSchema,
	head: () =>
		seo({
			title: m.auth_invite_seo_title(),
			description: m.auth_invite_seo_description(),
			path: "/accept-invitation",
			noindex: true,
		}),
	component: AcceptInvitationPage,
});

function AcceptInvitationPage() {
	const { token } = Route.useSearch();

	const {
		data: invitation,
		isLoading,
		error: invitationError,
	} = useInvitationDetailsQuery(token || "");

	if (!token) {
		return (
			<ErrorScreen
				title={m.auth_invite_invalid_title()}
				description={m.auth_invite_invalid_description()}
			/>
		);
	}

	if (invitationError) {
		const isExpired = invitationError.message.includes("expired");
		return (
			<ErrorScreen
				title={
					isExpired
						? m.auth_invite_expired_title()
						: m.auth_invite_not_found_title()
				}
				description={
					isExpired
						? m.auth_invite_expired_description()
						: m.auth_invite_not_found_description()
				}
			/>
		);
	}

	if (isLoading || !invitation) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (invitation.user_exists) {
		return <AutoAcceptInvitation invitation={invitation} token={token} />;
	}

	return <NewUserInvitationForm invitation={invitation} token={token} />;
}

function AutoAcceptInvitation({
	invitation,
	token,
}: {
	invitation: InvitationDetailsResponse;
	token: string;
}) {
	const navigate = useNavigate();
	const acceptMutation = useAcceptInvitationMutation(token);

	useMountEffect(() => {
		acceptMutation.mutateAsync({}).then(() => {
			navigate({
				to: homeRoute(invitation),
				params: { orgId: invitation.organization_id.toString() },
			});
		});
	});

	return (
		<div className="flex min-h-screen items-center justify-center">
			<Spinner />
		</div>
	);
}

function NewUserInvitationForm({
	invitation,
	token,
}: {
	invitation: InvitationDetailsResponse;
	token: string;
}) {
	const navigate = useNavigate();
	const acceptMutation = useAcceptInvitationMutation(token);
	const [showPassword, setShowPassword] = useState(false);

	const form = useForm({
		defaultValues: {
			password: "",
		},
		validators: {
			onSubmit: acceptInvitationFormSchema,
		},
		onSubmit: async ({ value }) => {
			await acceptMutation.mutateAsync({ password: value.password });
			navigate({
				to: homeRoute(invitation),
				params: { orgId: invitation.organization_id.toString() },
			});
		},
	});

	return (
		<div className="flex min-h-screen items-center justify-center p-6 font-[450]">
			<div className="flex w-full max-w-xs flex-col gap-8">
				<div className="flex flex-col gap-8">
					<div className="flex flex-col gap-4 items-center text-center">
						<Avatar className="size-16">
							{invitation.organization_logo ? (
								<AvatarImage
									src={invitation.organization_logo}
									alt={invitation.organization_name}
								/>
							) : null}
							<AvatarFallback>
								<BuildingsIcon
									className="size-8 text-muted-foreground"
									weight="duotone"
								/>
							</AvatarFallback>
						</Avatar>
						<div>
							<h1 className="text-2xl font-medium tracking-tight text-foreground">
								{m.auth_invite_join_title({
									name: invitation.organization_name,
								})}
							</h1>
							<p className="text-sm font-normal text-muted-foreground/70 mt-2">
								{m.auth_invite_subtitle()}{" "}
								<span className="font-logo text-base">forgecmms</span>{" "}
								{m.auth_invite_subtitle_suffix()}
							</p>
						</div>
					</div>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
						className="flex flex-col gap-4"
					>
						<FieldGroup>
							<Field>
								<FieldLabel className="text-sm font-medium">
									{m.auth_field_email()}
								</FieldLabel>
								<InputGroup className="h-10">
									<InputGroupInput
										type="email"
										value={invitation.email}
										disabled
										className="bg-muted/50 cursor-not-allowed"
									/>
								</InputGroup>
							</Field>

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
													placeholder={m.auth_invite_placeholder_password()}
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

							{acceptMutation.isError && (
								<Alert variant="destructive">
									<WarningCircleIcon weight="duotone" />
									<AlertTitle>
										{acceptMutation.error?.message || m.auth_error_generic()}
									</AlertTitle>
								</Alert>
							)}

							<Field>
								<Button
									type="submit"
									size="xl"
									disabled={acceptMutation.isPending}
								>
									{acceptMutation.isPending ? (
										<Spinner />
									) : (
										m.auth_invite_button()
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

function ErrorScreen({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
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
								{title}
							</h1>
							<p className="text-sm font-normal text-muted-foreground/70">
								{description}
							</p>
						</div>
					</div>

					<Link to="/login">
						<Button size="xl" className="w-full">
							{m.auth_invite_go_to_login()}
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
