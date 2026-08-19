import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/org/$orgId/settings/")({
	beforeLoad: ({ params }) => {
		throw redirect({
			to: "/org/$orgId/settings/profile",
			params: { orgId: params.orgId },
		});
	},
});
