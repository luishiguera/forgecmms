import { SignOutIcon } from "@phosphor-icons/react/dist/csr/SignOut";
import { UserCircleIcon } from "@phosphor-icons/react/dist/csr/UserCircle";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLogoutMutation } from "@/lib/queries/auth";
import { meQueryOptions } from "@/lib/queries/user";

export function NavUser() {
	const navigate = useNavigate();
	const { data: user, isLoading } = useQuery(meQueryOptions());
	const logoutMutation = useLogoutMutation();

	const handleLogout = () => {
		logoutMutation.mutate(undefined, {
			onSuccess: () => {
				navigate({ to: "/login" });
			},
		});
	};

	if (isLoading) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<div className="flex items-center justify-center p-2">
						<div className="size-8 rounded-lg bg-sidebar-accent animate-pulse" />
					</div>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	if (!user) {
		return null;
	}

	const fullName = user.full_name;

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton
					size="lg"
					onClick={handleLogout}
					className="cursor-pointer"
					disabled={logoutMutation.isPending}
				>
					<Avatar className="size-8">
						<AvatarImage src={user.photo_url ?? undefined} alt={fullName} />
						<AvatarFallback className="bg-sidebar-accent text-sidebar-foreground">
							<UserCircleIcon className="size-4" weight="duotone" />
						</AvatarFallback>
					</Avatar>
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-medium">{fullName}</span>
						<span className="truncate text-xs">{user.email}</span>
					</div>
					<SignOutIcon className="h-5 w-5 ml-auto shrink-0" />
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
