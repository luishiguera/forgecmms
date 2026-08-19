import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { TimezoneNotice } from "@/components/shared/timezone-notice";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { organizationQueryOptions } from "@/lib/queries/organization";

interface OrganizationLayoutProps {
	children: ReactNode;
	organizationId: string;
}

export function OrganizationLayout({
	children,
	organizationId,
}: OrganizationLayoutProps) {
	const { data: organization, isLoading: orgLoading } = useQuery(
		organizationQueryOptions(organizationId),
	);

	if (orgLoading || !organization) {
		return (
			<div className="flex h-screen w-full items-center justify-center">
				<div className="flex flex-col items-center gap-3">
					<Spinner className="size-8 text-primary" />
				</div>
			</div>
		);
	}

	return (
		<SidebarProvider>
			<AppSidebar organization={organization} />
			<SidebarInset className="h-screen overflow-hidden">
				<main className="flex flex-col flex-1 min-h-0 overflow-hidden">
					<TimezoneNotice className="shrink-0 rounded-none border-x-0 border-t-0 px-3 py-2 lg:px-4" />
					<div className="flex flex-1 min-h-0 flex-col">{children}</div>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
