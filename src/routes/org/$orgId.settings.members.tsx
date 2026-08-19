import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import { CrownSimpleIcon } from "@phosphor-icons/react/dist/csr/CrownSimple";
import { FunnelIcon } from "@phosphor-icons/react/dist/csr/Funnel";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/csr/PencilSimple";
import { TrashIcon } from "@phosphor-icons/react/dist/csr/Trash";
import { UserIcon } from "@phosphor-icons/react/dist/csr/User";
import { UsersIcon } from "@phosphor-icons/react/dist/csr/Users";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
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
import {
	type WorkingDay,
	WorkingHoursFields,
} from "@/components/shared/working-hours-fields";
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
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { FilterTrigger } from "@/components/ui/filter-trigger";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import {
	PanelDetail,
	PanelDetailContent,
	PanelDetailHeader,
} from "@/components/ui/panel-layout";
import { Popover, PopoverContent } from "@/components/ui/popover";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import {
	organizationMembersQueryOptions,
	useRemoveMemberMutation,
	useUpdateMemberMutation,
} from "@/lib/queries/organization";
import { meQueryOptions } from "@/lib/queries/user";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages";
import type { Access } from "@/server/domains/organizations/schema";

const DEFAULT_PAGE_SIZE = 20;

const searchSchema = z.object({
	q: z.string().optional(),
	access: z.enum(["field", "backoffice"]).optional(),
	page: z.coerce.number().int().positive().optional(),
	size: z.coerce.number().int().positive().optional(),
});

export const Route = createFileRoute("/org/$orgId/settings/members")({
	validateSearch: searchSchema,
	component: TeamPage,
});

function TeamPage() {
	const { orgId } = Route.useParams();
	const navigate = useNavigate({ from: Route.fullPath });
	const {
		q: searchQuery,
		access: accessFilter,
		page,
		size,
	} = Route.useSearch();
	const currentPage = page ?? 1;
	const pageSize = size ?? DEFAULT_PAGE_SIZE;
	const [editMember, setEditMember] = useState<{
		user_id: number;
		full_name: string;
		accesses: Access[];
		working_hours: WorkingDay[];
		is_owner: boolean;
	} | null>(null);
	const [removeMember, setRemoveMember] = useState<{
		user_id: number;
		full_name: string;
	} | null>(null);

	const { data: currentUser } = useQuery(meQueryOptions());

	const setSearchQuery = (value: string | null) =>
		navigate({
			search: (prev) => ({ ...prev, q: value || undefined, page: undefined }),
		});

	const setAccessFilter = (value: "field" | "backoffice" | null) =>
		navigate({
			search: (prev) => ({
				...prev,
				access: value || undefined,
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

	const { data: membersData, isLoading } = useQuery(
		organizationMembersQueryOptions(orgId, {
			page: currentPage,
			size: pageSize,
			q: searchQuery || undefined,
			access: accessFilter ?? undefined,
		}),
	);

	const updateMemberMutation = useUpdateMemberMutation(orgId);
	const removeMemberMutation = useRemoveMemberMutation(orgId);

	const editForm = useForm({
		defaultValues: {
			accesses: editMember?.accesses ?? ["field"],
			working_hours: editMember?.working_hours ?? [],
		},
		onSubmit: async ({ value }) => {
			if (!editMember) return;
			await updateMemberMutation.mutateAsync({
				userId: editMember.user_id,
				data: {
					accesses: canEditAccesses ? value.accesses : undefined,
					working_hours: value.working_hours,
				},
			});
		},
	});

	const members = membersData?.items ?? [];
	const total = membersData?.total ?? 0;
	const totalPages = Math.ceil(total / pageSize);

	const ownerMember = members.find((m) => m.is_owner);
	const isOwner =
		currentUser?.email != null && ownerMember?.email === currentUser.email;
	const canEditAccesses = isOwner && !editMember?.is_owner;

	const accessLabels = {
		desk: m.members_access_desk(),
		field: m.members_access_field(),
	};

	const handleRemoveMember = async () => {
		if (!removeMember) return;
		await removeMemberMutation.mutateAsync(removeMember.user_id);
		setRemoveMember(null);
	};

	return (
		<PanelDetail>
			<PanelDetailHeader
				title={m.members_title()}
				subtitle={m.members_subtitle({ count: total })}
			/>

			<PanelDetailContent>
				<div className="flex flex-col gap-3">
					<InputGroup>
						<InputGroupAddon align="inline-start">
							<MagnifyingGlassIcon className="size-4" weight="duotone" />
						</InputGroupAddon>
						<InputGroupInput
							type="search"
							placeholder={m.members_search_placeholder()}
							value={searchQuery ?? ""}
							onChange={(e) => setSearchQuery(e.target.value || null)}
						/>
					</InputGroup>

					<div className="flex flex-wrap gap-1.5">
						<Popover>
							<FilterTrigger
								icon={FunnelIcon}
								label={m.members_filter_access()}
								count={accessFilter ? 1 : 0}
								selectedLabel={
									accessFilter === "backoffice"
										? m.members_access_desk()
										: accessFilter === "field"
											? m.members_access_field()
											: undefined
								}
								onClear={() => setAccessFilter(null)}
							/>
							<PopoverContent align="start" className="w-40 p-1 gap-0">
								<button
									type="button"
									onClick={() =>
										setAccessFilter(
											accessFilter === "backoffice" ? null : "backoffice",
										)
									}
									className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-accent text-left w-full"
								>
									<CheckIcon
										className={`size-3.5 ${accessFilter === "backoffice" ? "opacity-100" : "opacity-0"}`}
										weight="bold"
									/>
									{m.members_access_desk()}
								</button>
								<button
									type="button"
									onClick={() =>
										setAccessFilter(accessFilter === "field" ? null : "field")
									}
									className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-accent text-left w-full"
								>
									<CheckIcon
										className={`size-3.5 ${accessFilter === "field" ? "opacity-100" : "opacity-0"}`}
										weight="bold"
									/>
									{m.members_access_field()}
								</button>
							</PopoverContent>
						</Popover>
					</div>
				</div>

				<div className="text-xs text-muted-foreground">
					{m.members_count({ count: members.length })}
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Spinner className="size-6" />
					</div>
				) : members.length === 0 ? (
					<div className="text-center py-12 text-muted-foreground">
						<UsersIcon
							className="size-10 mx-auto mb-3 opacity-40"
							weight="duotone"
						/>
						<p className="text-sm font-medium">{m.members_empty_title()}</p>
						<p className="text-xs mt-1">{m.members_empty_subtitle()}</p>
					</div>
				) : (
					<>
						<ItemGroup>
							{members.map((member) => (
								<Item key={member.user_id} variant="outline">
									<ItemMedia variant="image">
										{member.photo_url ? (
											<img
												src={member.photo_url}
												alt=""
												className="size-full object-cover"
											/>
										) : (
											<UserIcon className="w-5 h-5 text-muted-foreground" />
										)}
									</ItemMedia>
									<ItemContent>
										<ItemTitle>{member.full_name}</ItemTitle>
										<ItemDescription>{member.email}</ItemDescription>
									</ItemContent>
									<ItemActions>
										{member.is_owner && (
											<Badge
												variant="outline"
												className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"
											>
												<CrownSimpleIcon className="size-3" weight="fill" />
												{m.members_badge_owner()}
											</Badge>
										)}
										<AccessBadges
											accesses={member.accesses}
											labels={accessLabels}
										/>
										<Button
											variant="ghost"
											size="icon-xs"
											onClick={() =>
												setEditMember({
													user_id: member.user_id,
													full_name: member.full_name,
													accesses: member.accesses,
													working_hours: member.working_hours,
													is_owner: member.is_owner,
												})
											}
										>
											<PencilSimpleIcon className="size-4" />
										</Button>
										{isOwner && !member.is_owner && (
											<Button
												variant="ghost"
												size="icon-xs"
												className="text-destructive hover:text-destructive"
												onClick={() =>
													setRemoveMember({
														user_id: member.user_id,
														full_name: member.full_name,
													})
												}
											>
												<TrashIcon className="size-4" />
											</Button>
										)}
									</ItemActions>
								</Item>
							))}
						</ItemGroup>

						<PaginationControl
							currentPage={currentPage}
							totalPages={totalPages}
							onPageChange={setPage}
						/>
					</>
				)}
			</PanelDetailContent>

			<Sheet
				open={!!editMember}
				onOpenChange={(open) => !open && setEditMember(null)}
			>
				<SheetContent className="data-[side=right]:sm:max-w-md gap-0 p-0">
					<SheetHeader className="border-b">
						<SheetTitle>{m.members_edit_title()}</SheetTitle>
						<SheetDescription>
							{m.members_edit_description({
								name: editMember?.full_name ?? "",
							})}
						</SheetDescription>
					</SheetHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							editForm.handleSubmit();
						}}
						className="flex flex-1 flex-col overflow-hidden"
					>
						<div className="flex-1 space-y-5 overflow-y-auto p-6">
							{updateMemberMutation.isError && (
								<Alert variant="destructive">
									<WarningCircleIcon weight="duotone" />
									<AlertTitle>
										{updateMemberMutation.error?.message ||
											m.members_error_update()}
									</AlertTitle>
								</Alert>
							)}

							<editForm.Field
								name="accesses"
								children={(field) => (
									<Field>
										<FieldLabel>{m.members_edit_field_access()}</FieldLabel>
										<div
											aria-disabled={!canEditAccesses}
											className={cn(
												!canEditAccesses &&
													"pointer-events-none opacity-50 select-none",
											)}
										>
											<AccessCheckboxGroup
												value={field.state.value}
												onChange={field.handleChange}
												labels={{
													...accessLabels,
													deskDescription: m.members_edit_desk_description(),
													fieldDescription: m.members_edit_field_description(),
												}}
											/>
										</div>
										{!isOwner && (
											<p className="mt-1.5 text-xs text-muted-foreground">
												{m.members_accesses_owner_only()}
											</p>
										)}
									</Field>
								)}
							/>

							<editForm.Field
								name="working_hours"
								children={(field) => (
									<Field>
										<FieldLabel>{m.members_hours_label()}</FieldLabel>
										<WorkingHoursFields
											value={field.state.value}
											onChange={field.handleChange}
										/>
									</Field>
								)}
							/>
						</div>

						<SheetFooter className="flex-row justify-end border-t">
							<Button
								type="button"
								variant="outline"
								onClick={() => setEditMember(null)}
							>
								{m.members_button_cancel()}
							</Button>
							<Button type="submit" disabled={updateMemberMutation.isPending}>
								{updateMemberMutation.isPending
									? m.members_button_saving()
									: m.members_button_save()}
							</Button>
						</SheetFooter>
					</form>
				</SheetContent>
			</Sheet>

			<Dialog
				open={!!removeMember}
				onOpenChange={(open) => !open && setRemoveMember(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{m.members_remove_title()}</DialogTitle>
						<DialogDescription>
							{m.members_remove_description({
								name: removeMember?.full_name ?? "",
							})}
						</DialogDescription>
					</DialogHeader>
					{removeMemberMutation.isError && (
						<Alert variant="destructive">
							<WarningCircleIcon weight="duotone" />
							<AlertTitle>
								{removeMemberMutation.error?.message ||
									m.members_error_remove()}
							</AlertTitle>
						</Alert>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setRemoveMember(null)}
						>
							{m.members_button_cancel()}
						</Button>
						<Button
							variant="destructive"
							onClick={handleRemoveMember}
							disabled={removeMemberMutation.isPending}
						>
							{removeMemberMutation.isPending
								? m.members_button_removing()
								: m.members_button_remove()}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PanelDetail>
	);
}
