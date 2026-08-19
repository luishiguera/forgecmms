import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import { ClockIcon } from "@phosphor-icons/react/dist/csr/Clock";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/csr/EnvelopeSimple";
import { FunnelIcon } from "@phosphor-icons/react/dist/csr/Funnel";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { ProhibitIcon } from "@phosphor-icons/react/dist/csr/Prohibit";
import { TrashIcon } from "@phosphor-icons/react/dist/csr/Trash";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { XCircleIcon } from "@phosphor-icons/react/dist/csr/XCircle";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import {
	AccessBadges,
	AccessCheckboxGroup,
} from "@/components/shared/access-fields";
import { PaginationControl } from "@/components/shared/pagination-control";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { FilterTrigger } from "@/components/ui/filter-trigger";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
	PanelDetail,
	PanelDetailContent,
	PanelDetailHeader,
} from "@/components/ui/panel-layout";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import {
	organizationInvitationsQueryOptions,
	useCancelInvitationMutation,
	useCreateInvitationMutation,
} from "@/lib/queries/invitation";
import { organizationMembersQueryOptions } from "@/lib/queries/organization";
import { meQueryOptions } from "@/lib/queries/user";
import * as m from "@/paraglide/messages";
import type { Access } from "@/server/domains/organizations/schema";
import { formatDate } from "@/utils/format-date";

const DEFAULT_PAGE_SIZE = 20;

const searchSchema = z.object({
	status: z.enum(["pending", "accepted", "expired", "cancelled"]).optional(),
	page: z.coerce.number().int().positive().optional(),
	size: z.coerce.number().int().positive().optional(),
});

export const Route = createFileRoute("/org/$orgId/settings/invitations")({
	validateSearch: searchSchema,
	component: InvitationsPage,
});

function InvitationsPage() {
	const { orgId } = Route.useParams();
	const navigate = useNavigate({ from: Route.fullPath });
	const { status: statusFilter, page, size } = Route.useSearch();
	const currentPage = page ?? 1;
	const pageSize = size ?? DEFAULT_PAGE_SIZE;
	const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
	const [cancelInvitation, setCancelInvitation] = useState<{
		id: number;
		email: string;
		full_name: string;
	} | null>(null);

	const { data: currentUser } = useQuery(meQueryOptions());
	const { data: membersData } = useQuery(
		organizationMembersQueryOptions(orgId, { page: 1, size: 100 }),
	);

	const setStatusFilter = (
		value: "pending" | "accepted" | "expired" | "cancelled" | null,
	) =>
		navigate({
			search: (prev) => ({
				...prev,
				status: value || undefined,
				page: undefined,
			}),
		});

	const setPage = (newPage: number) =>
		navigate({
			search: (prev) => ({
				...prev,
				page: newPage === 1 ? undefined : newPage,
			}),
		});

	const { data: invitationsData, isLoading } = useQuery(
		organizationInvitationsQueryOptions(orgId, {
			page: currentPage,
			size: pageSize,
			status: statusFilter ?? undefined,
		}),
	);

	const createInvitationMutation = useCreateInvitationMutation(orgId);
	const cancelInvitationMutation = useCancelInvitationMutation(orgId);

	const inviteForm = useForm({
		defaultValues: {
			email: "",
			full_name: "",
			accesses: ["field"] as Access[],
		},
		onSubmit: async ({ value }) => {
			await createInvitationMutation.mutateAsync({
				...value,
				email: value.email.trim().toLowerCase(),
			});
			setInviteDialogOpen(false);
			inviteForm.reset();
		},
	});

	const invitations = invitationsData?.items ?? [];
	const total = invitationsData?.total ?? 0;
	const totalPages = Math.ceil(total / pageSize);

	const members = membersData?.items ?? [];
	const ownerMember = members.find((m) => m.is_owner);
	const isOwner =
		currentUser?.email != null && ownerMember?.email === currentUser.email;

	const accessLabels = {
		desk: m.inv_access_desk(),
		field: m.inv_access_field(),
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "pending":
				return (
					<Badge
						variant="outline"
						className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"
					>
						<ClockIcon className="size-3" weight="fill" />
						{m.inv_status_pending()}
					</Badge>
				);
			case "accepted":
				return (
					<Badge
						variant="outline"
						className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"
					>
						<CheckIcon className="size-3" weight="bold" />
						{m.inv_status_accepted()}
					</Badge>
				);
			case "expired":
				return (
					<Badge
						variant="outline"
						className="text-[10px] bg-zinc-500/10 text-zinc-500 border-zinc-500/20 gap-1"
					>
						<XCircleIcon className="size-3" weight="fill" />
						{m.inv_status_expired()}
					</Badge>
				);
			case "cancelled":
				return (
					<Badge
						variant="outline"
						className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20 gap-1"
					>
						<ProhibitIcon className="size-3" weight="fill" />
						{m.inv_status_cancelled()}
					</Badge>
				);
			default:
				return null;
		}
	};

	const handleCancelInvitation = async () => {
		if (!cancelInvitation) return;
		await cancelInvitationMutation.mutateAsync(cancelInvitation.id);
		setCancelInvitation(null);
	};

	const getStatusLabel = (status: string | undefined) => {
		switch (status) {
			case "pending":
				return m.inv_status_pending();
			case "accepted":
				return m.inv_status_accepted();
			case "expired":
				return m.inv_status_expired();
			case "cancelled":
				return m.inv_status_cancelled();
			default:
				return undefined;
		}
	};

	return (
		<PanelDetail>
			<PanelDetailHeader
				title={m.inv_title()}
				subtitle={m.inv_subtitle({ count: total })}
				actions={
					<Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
						<DialogTrigger
							render={
								<Button>
									<PlusIcon className="size-4 mr-1" weight="bold" />
									{m.inv_button_invite()}
								</Button>
							}
						/>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>{m.inv_create_title()}</DialogTitle>
								<DialogDescription>
									{m.inv_create_description()}
								</DialogDescription>
							</DialogHeader>
							<form
								onSubmit={(e) => {
									e.preventDefault();
									inviteForm.handleSubmit();
								}}
								className="space-y-4"
							>
								{createInvitationMutation.isError && (
									<Alert variant="destructive">
										<WarningCircleIcon weight="duotone" />
										<AlertTitle>
											{createInvitationMutation.error?.message ||
												m.inv_error_create()}
										</AlertTitle>
									</Alert>
								)}

								<inviteForm.Field
									name="full_name"
									children={(field) => (
										<Field>
											<FieldLabel>{m.inv_field_fullname()}</FieldLabel>
											<InputGroup>
												<InputGroupInput
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													placeholder={m.inv_placeholder_fullname()}
													required
												/>
											</InputGroup>
										</Field>
									)}
								/>

								<inviteForm.Field
									name="email"
									children={(field) => (
										<Field>
											<FieldLabel>{m.inv_field_email()}</FieldLabel>
											<InputGroup>
												<InputGroupInput
													type="email"
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													placeholder={m.inv_placeholder_email()}
													required
												/>
											</InputGroup>
										</Field>
									)}
								/>

								<inviteForm.Field
									name="accesses"
									children={(field) => (
										<Field>
											<FieldLabel>{m.inv_field_access()}</FieldLabel>
											<AccessCheckboxGroup
												value={field.state.value}
												onChange={field.handleChange}
												labels={{
													...accessLabels,
													deskDescription: m.inv_access_desk_description(),
													fieldDescription: m.inv_access_field_description(),
												}}
											/>
										</Field>
									)}
								/>

								<DialogFooter>
									<Button
										type="button"
										variant="outline"
										onClick={() => setInviteDialogOpen(false)}
									>
										{m.inv_button_cancel()}
									</Button>
									<Button
										type="submit"
										disabled={createInvitationMutation.isPending}
									>
										{createInvitationMutation.isPending
											? m.inv_button_sending()
											: m.inv_button_send()}
									</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				}
			/>

			<PanelDetailContent>
				<div className="flex flex-col gap-3">
					<div className="flex flex-wrap gap-1.5">
						<Popover>
							<FilterTrigger
								icon={FunnelIcon}
								label={m.inv_filter_status()}
								count={statusFilter ? 1 : 0}
								selectedLabel={getStatusLabel(statusFilter)}
								onClear={() => setStatusFilter(null)}
							/>
							<PopoverContent align="start" className="w-40 p-1 gap-0">
								{(["pending", "accepted", "expired", "cancelled"] as const).map(
									(status) => (
										<button
											key={status}
											type="button"
											onClick={() =>
												setStatusFilter(statusFilter === status ? null : status)
											}
											className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-accent text-left w-full"
										>
											<CheckIcon
												className={`size-3.5 ${statusFilter === status ? "opacity-100" : "opacity-0"}`}
												weight="bold"
											/>
											{getStatusLabel(status)}
										</button>
									),
								)}
							</PopoverContent>
						</Popover>
					</div>
				</div>

				<div className="text-xs text-muted-foreground">
					{m.inv_count({ count: invitations.length })}
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Spinner className="size-6" />
					</div>
				) : invitations.length === 0 ? (
					<div className="text-center py-12 text-muted-foreground">
						<EnvelopeSimpleIcon
							className="size-10 mx-auto mb-3 opacity-40"
							weight="duotone"
						/>
						<p className="text-sm font-medium">{m.inv_empty_title()}</p>
						<p className="text-xs mt-1">
							{statusFilter
								? m.inv_empty_subtitle_filter()
								: m.inv_empty_subtitle_default()}
						</p>
					</div>
				) : (
					<>
						<div className="space-y-1">
							{invitations.map((invitation) => (
								<div
									key={invitation.id}
									className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors group"
								>
									<div className="flex items-center justify-center size-9 rounded-full bg-muted text-muted-foreground">
										<EnvelopeSimpleIcon className="size-4" weight="duotone" />
									</div>
									<div className="flex-1 min-w-0">
										<div className="font-medium text-sm">
											{invitation.full_name}
										</div>
										<div className="text-xs text-muted-foreground truncate">
											{invitation.email}
										</div>
									</div>
									{isOwner && invitation.status === "pending" && (
										<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
											<Button
												variant="ghost"
												size="icon-xs"
												className="text-destructive hover:text-destructive"
												onClick={() =>
													setCancelInvitation({
														id: invitation.id,
														email: invitation.email,
														full_name: invitation.full_name,
													})
												}
											>
												<TrashIcon className="size-4" />
											</Button>
										</div>
									)}
									<div className="text-xs text-muted-foreground shrink-0 text-right whitespace-nowrap">
										{invitation.status === "pending" ? (
											<span>
												{m.inv_expires({
													date: formatDate(invitation.expires_at),
												})}
											</span>
										) : (
											<span>{formatDate(invitation.created_at)}</span>
										)}
									</div>
									<div className="flex items-center gap-1.5 shrink-0">
										<AccessBadges
											accesses={invitation.accesses}
											labels={accessLabels}
										/>
										{getStatusBadge(invitation.status)}
									</div>
								</div>
							))}
						</div>

						<PaginationControl
							currentPage={currentPage}
							totalPages={totalPages}
							onPageChange={setPage}
						/>
					</>
				)}
			</PanelDetailContent>

			<Dialog
				open={!!cancelInvitation}
				onOpenChange={(open) => !open && setCancelInvitation(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{m.inv_cancel_title()}</DialogTitle>
						<DialogDescription>
							{m.inv_cancel_description({
								name: cancelInvitation?.full_name ?? "",
								email: cancelInvitation?.email ?? "",
							})}
						</DialogDescription>
					</DialogHeader>
					{cancelInvitationMutation.isError && (
						<Alert variant="destructive">
							<WarningCircleIcon weight="duotone" />
							<AlertTitle>
								{cancelInvitationMutation.error?.message ||
									m.inv_error_cancel()}
							</AlertTitle>
						</Alert>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setCancelInvitation(null)}
						>
							{m.inv_cancel_button_keep()}
						</Button>
						<Button
							variant="destructive"
							onClick={handleCancelInvitation}
							disabled={cancelInvitationMutation.isPending}
						>
							{cancelInvitationMutation.isPending
								? m.inv_cancel_button_cancelling()
								: m.inv_cancel_button_confirm()}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PanelDetail>
	);
}
