import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { ErrorBoundary } from "@/components/error-boundary";
import { NotFound } from "@/components/not-found";
import { Toaster } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/spinner";
import { ThemeProvider } from "@/hooks/use-theme";
import { getLocale } from "../paraglide/runtime";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
}>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "forgecmms",
			},
			{
				name: "theme-color",
				content: "#135B42",
			},
		],
		links: [
			{
				rel: "preconnect",
				href: "https://storage.massadesk.com",
			},
			{
				rel: "dns-prefetch",
				href: "https://storage.massadesk.com",
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg",
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				sizes: "64x64 32x32 24x24 16x16",
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "96x96",
				href: "/favicon-96x96.png",
			},
			{
				rel: "manifest",
				href: "/site.webmanifest",
			},
		],
	}),

	notFoundComponent: () => <NotFound />,
	pendingComponent: ShellPending,
	component: RootComponent,
	shellComponent: RootDocument,
	errorComponent: ({ error }) => (
		<ErrorBoundary key={error.message} error={error} />
	),
});

function ShellPending() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<Spinner className="size-8" />
		</div>
	);
}

function RootComponent() {
	return (
		<ThemeProvider>
			<div id="root" className="min-h-full w-full">
				<Outlet />
			</div>
		</ThemeProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang={getLocale()} className="antialiased">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
				<Toaster />
			</body>
		</html>
	);
}
