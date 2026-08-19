import { createFileRoute, redirect } from "@tanstack/react-router";
import { organizationsQueryOptions } from "@/lib/queries/organization";
import type { OrganizationResponse } from "@/server/domains/organizations/schema";
import { isAppError } from "@/server/errors";

export const Route = createFileRoute("/app/")({
	head: () => ({
		meta: [{ name: "robots", content: "noindex,nofollow" }],
	}),
	beforeLoad: async ({ context }) => {
		let organizations: OrganizationResponse[];

		try {
			organizations = await context.queryClient.ensureQueryData(
				organizationsQueryOptions(),
			);
		} catch (error) {
			if (!isAppError(error, "unauthorized")) throw error;
			throw redirect({ to: "/login", search: { redirect: "/app" } });
		}

		const [first] = organizations;
		if (organizations.length === 1 && first?.id) {
			throw redirect({
				to: "/app/$orgId",
				params: { orgId: first.id.toString() },
			});
		}

		throw redirect({ to: "/select-organization" });
	},
	component: () => null,
});
