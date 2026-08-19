import { BuildingsIcon } from "@phosphor-icons/react/dist/csr/Buildings";
import { CrownSimpleIcon } from "@phosphor-icons/react/dist/csr/CrownSimple";
import { DesktopIcon } from "@phosphor-icons/react/dist/csr/Desktop";
import { DeviceMobileIcon } from "@phosphor-icons/react/dist/csr/DeviceMobile";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
	organizationsQueryOptions,
	useCreateOrganizationMutation,
} from "@/lib/queries/organization";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages";
import type { OrganizationResponse } from "@/server/domains/organizations/schema";
import { organizationCreateSchema } from "@/server/domains/organizations/schema";
import { seo } from "@/utils/seo";

export const Route = createFileRoute("/select-organization")({
	head: () =>
		seo({
			title: m.auth_org_seo_title(),
			description: m.auth_org_seo_description(),
			path: "/select-organization",
			noindex: true,
		}),
	component: SelectOrganizationPage,
});

function SelectOrganizationPage() {
	const navigate = useNavigate();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const { data: organizations = [], isLoading } = useQuery(
		organizationsQueryOptions(),
	);

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Spinner className="size-8" />
			</div>
		);
	}

	const openOrganization = (
		org: OrganizationResponse,
		target: "desk" | "field",
	) => {
		if (!org.id) return;
		navigate({
			to: target === "desk" ? "/org/$orgId" : "/app/$orgId",
			params: { orgId: org.id.toString() },
		});
	};

	const handleSelectOrg = (org: OrganizationResponse) => {
		if (!org.id) return;
		openOrganization(
			org,
			org.accesses?.includes("backoffice") ? "desk" : "field",
		);
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-6 font-[450]">
			<div className="flex w-full max-w-sm flex-col gap-8">
				<div className="flex items-center justify-between">
					<Link to="/">
						<span className="font-logo text-3xl">forgecmms</span>
					</Link>
				</div>

				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-2">
						<h1 className="text-2xl font-medium tracking-tight text-foreground">
							{m.auth_org_title()}
						</h1>
						<p className="text-sm font-normal text-muted-foreground/70">
							{m.auth_org_subtitle()}
						</p>
					</div>

					{organizations.length === 0 ? (
						<Empty className="border">
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<BuildingsIcon weight="duotone" />
								</EmptyMedia>
								<EmptyTitle>{m.auth_org_empty_title()}</EmptyTitle>
								<EmptyDescription>
									{m.auth_org_empty_description()}
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						<div className="flex flex-col gap-3">
							{organizations.map((org) => (
								<OrganizationCard
									key={org.id}
									organization={org}
									onSelect={handleSelectOrg}
									onOpen={openOrganization}
								/>
							))}
						</div>
					)}

					<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<DialogTrigger
							render={
								<Button variant="outline" size="xl" className="w-full gap-2" />
							}
						>
							<PlusIcon className="size-4" weight="bold" />
							{m.auth_org_create_button()}
						</DialogTrigger>
						<CreateOrganizationDialog onClose={() => setIsDialogOpen(false)} />
					</Dialog>
				</div>
			</div>
		</div>
	);
}

interface OrganizationCardProps {
	organization: OrganizationResponse;
	onSelect: (org: OrganizationResponse) => void;
	onOpen: (org: OrganizationResponse, target: "desk" | "field") => void;
}

function OrganizationCard({
	organization,
	onSelect,
	onOpen,
}: OrganizationCardProps) {
	const hasBackoffice = organization.accesses?.includes("backoffice");
	const hasField = organization.accesses?.includes("field");
	const isChoice = hasBackoffice && hasField;

	return (
		<Card
			className={cn(
				"transition-all",
				!isChoice && "cursor-pointer hover:ring-2 hover:ring-primary/20",
			)}
			onClick={isChoice ? undefined : () => onSelect(organization)}
		>
			<CardContent className="flex items-center gap-4">
				<Avatar className="size-12">
					{organization.logo_url ? (
						<AvatarImage
							src={organization.logo_url}
							alt={organization.name ?? "Organization"}
						/>
					) : null}
					<AvatarFallback className="bg-primary text-primary-foreground text-lg">
						{organization.name?.charAt(0).toUpperCase() ?? "O"}
					</AvatarFallback>
				</Avatar>

				<div className="flex-1 min-w-0">
					<span className="font-medium truncate">{organization.name}</span>
					{isChoice ? (
						<p className="mt-1 text-muted-foreground">
							{m.auth_org_choose_surface()}
						</p>
					) : (
						<div className="flex items-center gap-1.5 mt-1">
							{hasBackoffice && (
								<Badge variant="outline" className="gap-1">
									<DesktopIcon className="size-3" weight="duotone" />
									{m.members_access_desk()}
								</Badge>
							)}
							{hasField && (
								<Badge variant="outline" className="gap-1">
									<DeviceMobileIcon className="size-3" weight="duotone" />
									{m.members_access_field()}
								</Badge>
							)}
						</div>
					)}
				</div>

				{organization.is_owner ? (
					<Badge variant="secondary" className="gap-1">
						<CrownSimpleIcon className="size-3" weight="fill" />
						{m.members_badge_owner()}
					</Badge>
				) : null}
			</CardContent>

			{isChoice && (
				<CardFooter className="grid grid-cols-2 gap-2">
					<Button
						variant="outline"
						size="xl"
						className="gap-2 hover:border-primary/40"
						onClick={() => onOpen(organization, "desk")}
					>
						<DesktopIcon
							className="size-4 text-muted-foreground"
							weight="duotone"
						/>
						{m.auth_org_open_desk()}
					</Button>
					<Button
						variant="outline"
						size="xl"
						className="gap-2 hover:border-primary/40"
						onClick={() => onOpen(organization, "field")}
					>
						<DeviceMobileIcon
							className="size-4 text-muted-foreground"
							weight="duotone"
						/>
						{m.auth_org_open_field()}
					</Button>
				</CardFooter>
			)}
		</Card>
	);
}

interface CreateOrganizationDialogProps {
	onClose: () => void;
}

function CreateOrganizationDialog({ onClose }: CreateOrganizationDialogProps) {
	const navigate = useNavigate();
	const createOrgMutation = useCreateOrganizationMutation();

	const form = useForm({
		defaultValues: {
			name: "",
		},
		validators: {
			onSubmit: organizationCreateSchema,
		},
		onSubmit: async ({ value }) => {
			const response = await createOrgMutation.mutateAsync(value);
			onClose();
			if (response.id) {
				navigate({
					to: "/org/$orgId",
					params: { orgId: response.id.toString() },
				});
			}
		},
	});

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>{m.auth_org_dialog_title()}</DialogTitle>
				<DialogDescription>{m.auth_org_dialog_description()}</DialogDescription>
			</DialogHeader>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
			>
				<FieldGroup>
					<form.Field
						name="name"
						children={(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name} className="text-sm">
										{m.auth_org_field_name()}
									</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										type="text"
										placeholder={m.auth_org_placeholder_name()}
										className="h-10"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={isInvalid}
										autoFocus
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					/>
				</FieldGroup>

				<DialogFooter className="mt-4">
					<Button
						type="submit"
						disabled={createOrgMutation.isPending}
						className="w-full sm:w-auto"
					>
						{createOrgMutation.isPending ? (
							<Spinner />
						) : (
							m.auth_org_dialog_button()
						)}
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	);
}
