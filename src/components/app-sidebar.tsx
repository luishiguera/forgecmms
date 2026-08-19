import { BuildingsIcon } from "@phosphor-icons/react/dist/csr/Buildings";
import { CalendarDotsIcon } from "@phosphor-icons/react/dist/csr/CalendarDots";
import { ClipboardTextIcon } from "@phosphor-icons/react/dist/csr/ClipboardText";
import { DeviceMobileIcon } from "@phosphor-icons/react/dist/csr/DeviceMobile";
import { GearSixIcon } from "@phosphor-icons/react/dist/csr/GearSix";
import { HardDriveIcon } from "@phosphor-icons/react/dist/csr/HardDrive";
import { HouseIcon } from "@phosphor-icons/react/dist/csr/House";
import { ListChecksIcon } from "@phosphor-icons/react/dist/csr/ListChecks";
import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { WrenchIcon } from "@phosphor-icons/react/dist/csr/Wrench";
import { Link, useLocation } from "@tanstack/react-router";
import type * as React from "react";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import * as m from "@/paraglide/messages";
import type { OrganizationResponse } from "@/server/domains/organizations/schema";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	organization: OrganizationResponse;
}

export function AppSidebar({ organization, ...props }: AppSidebarProps) {
	const location = useLocation();
	const orgId = organization.id?.toString() ?? "";

	const navData = {
		operations: [
			{
				title: m.sidebar_home(),
				url: `/org/${orgId}`,
				icon: HouseIcon,
			},
			{
				title: m.sidebar_schedule(),
				url: `/org/${orgId}/schedule`,
				icon: CalendarDotsIcon,
			},
			{
				title: m.sidebar_work_orders(),
				url: `/org/${orgId}/work-orders`,
				icon: ClipboardTextIcon,
			},
		],
		management: [
			{
				title: m.sidebar_parts(),
				url: `/org/${orgId}/parts`,
				icon: WrenchIcon,
			},
			{
				title: m.sidebar_assets(),
				url: `/org/${orgId}/assets`,
				icon: HardDriveIcon,
			},
			{
				title: m.sidebar_locations(),
				url: `/org/${orgId}/locations`,
				icon: MapPinIcon,
			},
			{
				title: m.sidebar_businesses(),
				url: `/org/${orgId}/businesses`,
				icon: BuildingsIcon,
			},
			{
				title: m.sidebar_procedures(),
				url: `/org/${orgId}/procedures`,
				icon: ListChecksIcon,
			},
			{
				title: m.sidebar_settings(),
				url: `/org/${orgId}/settings`,
				icon: GearSixIcon,
			},
		],
	};

	return (
		<Sidebar variant="sidebar" {...props}>
			<SidebarHeader className="p-4">
				<TeamSwitcher activeOrganization={organization} />
			</SidebarHeader>

			<SidebarContent className="px-2">
				<div className="px-2 pb-2">
					<Button
						size="xl"
						nativeButton={false}
						className="w-full justify-between bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80"
						render={
							<Link
								to="/org/$orgId/work-orders"
								params={{ orgId }}
								search={{ create: true }}
							/>
						}
					>
						{m.sidebar_create_work_order()}
						<PlusIcon className="size-4" weight="duotone" />
					</Button>
				</div>

				<SidebarGroup>
					<SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground uppercase tracking-wider">
						{m.sidebar_operations()}
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navData.operations.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										render={<Link to={item.url} />}
										isActive={
											item.url === `/org/${orgId}`
												? location.pathname === item.url
												: location.pathname.startsWith(item.url)
										}
										className="h-9 font-medium"
									>
										<item.icon className="size-4" weight="fill" />
										<span>{item.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground uppercase tracking-wider">
						{m.sidebar_management()}
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navData.management.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										render={<Link to={item.url} />}
										isActive={location.pathname.startsWith(item.url)}
										className="h-9 font-medium"
									>
										<item.icon className="size-4" weight="fill" />
										<span>{item.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="p-2">
				{organization.accesses?.includes("field") && (
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								render={<Link to="/app/$orgId" params={{ orgId }} />}
								className="h-9 font-medium"
							>
								<DeviceMobileIcon className="size-4" weight="fill" />
								<span>{m.sidebar_field_app()}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				)}
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
