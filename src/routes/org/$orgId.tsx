import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { OrganizationLayout } from "@/layouts/organization-layout";
import { organizationQueryOptions } from "@/lib/queries/organization";
import { meQueryOptions } from "@/lib/queries/user";
import { isAppError } from "@/server/errors";

export const Route = createFileRoute("/org/$orgId")({
	head: () => ({
		meta: [{ name: "robots", content: "noindex,nofollow" }],
	}),
	beforeLoad: async ({ context, params, location }) => {
		try {
			await context.queryClient.ensureQueryData(meQueryOptions());
		} catch (error) {
			if (!isAppError(error, "unauthorized")) throw error;
			throw redirect({ to: "/login", search: { redirect: location.href } });
		}

		const organization = await context.queryClient.ensureQueryData(
			organizationQueryOptions(params.orgId),
		);
		if (!organization.accesses.includes("backoffice")) {
			throw redirect({ to: "/app/$orgId", params: { orgId: params.orgId } });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { orgId } = Route.useParams();

	return (
		<OrganizationLayout organizationId={orgId}>
			<Outlet />
		</OrganizationLayout>
	);
}
