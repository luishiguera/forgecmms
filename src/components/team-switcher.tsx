import { BuildingsIcon } from "@phosphor-icons/react/dist/csr/Buildings";
import { CaretUpDownIcon } from "@phosphor-icons/react/dist/csr/CaretUpDown";
import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import { LockSimpleIcon } from "@phosphor-icons/react/dist/csr/LockSimple";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { organizationsQueryOptions } from "@/lib/queries/organization";
import type { OrganizationResponse } from "@/server/domains/organizations/schema";

type Organization = OrganizationResponse;

export function TeamSwitcher({
	activeOrganization,
}: {
	activeOrganization?: Organization;
}) {
	const navigate = useNavigate();
	const { data: organizations = [] } = useQuery(organizationsQueryOptions());

	if (!activeOrganization) {
		return null;
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<SidebarMenuButton size="lg" className="h-auto py-2">
								<Avatar className="size-10">
									<AvatarImage
										src={activeOrganization.logo_url || undefined}
										alt={activeOrganization.name}
									/>
									<AvatarFallback className="bg-sidebar-accent text-sidebar-foreground">
										<BuildingsIcon className="size-5" weight="duotone" />
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left leading-tight">
									<span className="truncate font-semibold text-base">
										{activeOrganization.name}
									</span>
								</div>
								<CaretUpDownIcon className="ml-auto size-4" />
							</SidebarMenuButton>
						}
					/>
					<DropdownMenuContent align="start" side="bottom" sideOffset={4}>
						<DropdownMenuGroup>
							<DropdownMenuLabel>Organizations</DropdownMenuLabel>
							{organizations.map((org) => {
								const isBlocked = !org.accesses?.includes("backoffice");
								const isActive = org.id === activeOrganization.id;

								return (
									<DropdownMenuItem
										key={org.id}
										disabled={isBlocked}
										onClick={() =>
											!isBlocked &&
											navigate({
												to: "/org/$orgId",
												params: { orgId: org.id.toString() },
											})
										}
									>
										<Avatar className="size-6">
											<AvatarImage
												src={org.logo_url || undefined}
												alt={org.name}
											/>
											<AvatarFallback>
												<BuildingsIcon
													className="size-3 text-muted-foreground"
													weight="duotone"
												/>
											</AvatarFallback>
										</Avatar>
										<span className="truncate flex-1">{org.name}</span>
										{isBlocked ? (
											<LockSimpleIcon className="size-4 text-muted-foreground" />
										) : isActive ? (
											<CheckIcon className="size-4" />
										) : null}
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => navigate({ to: "/select-organization" })}
						>
							<PlusIcon className="size-4" />
							<span>Create organization</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
