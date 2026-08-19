import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { FieldLayout } from "@/layouts/field-layout";
import { meQueryOptions } from "@/lib/queries/user";
import { isAppError } from "@/server/errors";

export const Route = createFileRoute("/app/$orgId")({
	head: () => ({
		meta: [{ name: "robots", content: "noindex,nofollow" }],
	}),
	beforeLoad: async ({ context, location }) => {
		try {
			await context.queryClient.ensureQueryData(meQueryOptions());
		} catch (error) {
			if (!isAppError(error, "unauthorized")) throw error;
			throw redirect({ to: "/login", search: { redirect: location.href } });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<FieldLayout>
			<Outlet />
		</FieldLayout>
	);
}
