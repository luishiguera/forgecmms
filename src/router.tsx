import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { deLocalizeUrl, localizeUrl } from "./paraglide/runtime";
import { routeTree } from "./routeTree.gen";
import { isAppError } from "./server/errors";

export const getRouter = () => {
	let goToLogin: (() => void) | undefined;

	const redirectOnUnauthorized = (error: unknown) => {
		if (typeof window === "undefined") return;
		if (isAppError(error, "unauthorized")) goToLogin?.();
	};

	const queryClient = new QueryClient({
		queryCache: new QueryCache({ onError: redirectOnUnauthorized }),
		mutationCache: new MutationCache({ onError: redirectOnUnauthorized }),
		defaultOptions: {
			queries: {
				throwOnError: true,
				staleTime: 30_000,
				retry: (failureCount, error) =>
					isAppError(error) ? false : failureCount < 3,
				retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
			},
		},
	});

	const router = createRouter({
		routeTree,
		context: { queryClient },
		defaultPreload: "intent",
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		rewrite: {
			input: ({ url }) => deLocalizeUrl(url),
			output: ({ url }) => localizeUrl(url),
		},
	});
	goToLogin = () => {
		const { pathname, href } = router.state.location;
		if (pathname === "/login") return;
		router.navigate({ to: "/login", search: { redirect: href } });
	};

	setupRouterSsrQueryIntegration({
		router,
		queryClient,
	});

	return router;
};

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
