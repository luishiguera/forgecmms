import { BuildingsIcon } from "@phosphor-icons/react/dist/csr/Buildings";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/csr/EnvelopeSimple";
import { UserCircleIcon } from "@phosphor-icons/react/dist/csr/UserCircle";
import { UsersIcon } from "@phosphor-icons/react/dist/csr/Users";
import {
	createFileRoute,
	Link,
	Outlet,
	useMatchRoute,
} from "@tanstack/react-router";

import {
	PanelLayout,
	PanelList,
	PanelListContent,
	PanelListItem,
	PanelListItemAvatar,
	PanelListItemContent,
	PanelListItemTitle,
} from "@/components/ui/panel-layout";
import * as m from "@/paraglide/messages";

export const Route = createFileRoute("/org/$orgId/settings")({
	component: RouteComponent,
});

function RouteComponent() {
	const { orgId } = Route.useParams();
	const matchRoute = useMatchRoute();

	const sections = [
		{ id: "profile", label: m.settings_nav_profile(), icon: UserCircleIcon },
		{
			id: "organization",
			label: m.settings_nav_organization(),
			icon: BuildingsIcon,
		},
		{ id: "members", label: m.settings_nav_members(), icon: UsersIcon },
		{
			id: "invitations",
			label: m.settings_nav_invitations(),
			icon: EnvelopeSimpleIcon,
		},
	] as const;

	return (
		<div className="flex flex-col flex-1 min-h-0 overflow-hidden">
			<div className="flex items-start justify-between shrink-0 px-4 lg:px-6 py-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						{m.settings_title()}
					</h1>
					<p className="text-muted-foreground">{m.settings_subtitle()}</p>
				</div>
			</div>

			<PanelLayout className="flex-1 min-h-0">
				<PanelList className="max-w-80">
					<div className="p-3 border-b border-border shrink-0">
						<span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
							{m.settings_sidebar()}
						</span>
					</div>
					<PanelListContent>
						{sections.map((section) => {
							const isActive = matchRoute({
								to: `/org/$orgId/settings/${section.id}`,
								params: { orgId },
							});

							return (
								<Link
									key={section.id}
									to={`/org/$orgId/settings/${section.id}`}
									params={{ orgId }}
								>
									<PanelListItem isSelected={!!isActive}>
										<PanelListItemAvatar className="size-8">
											<section.icon className="size-4" weight="duotone" />
										</PanelListItemAvatar>
										<PanelListItemContent>
											<PanelListItemTitle>{section.label}</PanelListItemTitle>
										</PanelListItemContent>
									</PanelListItem>
								</Link>
							);
						})}
					</PanelListContent>
				</PanelList>

				<Outlet />
			</PanelLayout>
		</div>
	);
}
