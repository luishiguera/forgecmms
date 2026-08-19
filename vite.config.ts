import { paraglideVitePlugin } from "@inlang/paraglide-js";
import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";

const config = defineConfig(() => ({
	resolve: {
		tsconfigPaths: true,
	},
	server: {
		proxy: {
			"/storage": {
				target: process.env.STORAGE_ENDPOINT ?? "http://127.0.0.1:9000",
				changeOrigin: true,
				rewrite: (path: string) =>
					path.replace(
						/^\/storage/,
						`/${process.env.STORAGE_BUCKET ?? "forgecmms"}`,
					),
			},
		},
	},
	optimizeDeps: {
		include: ["@mdx-js/react", "react/jsx-runtime", "react/jsx-dev-runtime"],
	},
	plugins: [
		{
			enforce: "pre",
			...mdx({
				providerImportSource: "@mdx-js/react",
				remarkPlugins: [
					remarkGfm,
					remarkFrontmatter,
					[remarkMdxFrontmatter, { name: "frontmatter" }],
				],
			}),
		},
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/paraglide",
			outputStructure: "message-modules",
			cookieName: "PARAGLIDE_LOCALE",
			strategy: ["url", "cookie", "preferredLanguage", "baseLocale"],
			urlPatterns: [
				{
					pattern: "/",
					localized: [
						["en-US", "/"],
						["es", "/es"],
						["pt-BR", "/pt-BR"],
					],
				},
				{
					pattern: "/login",
					localized: [
						["en-US", "/login"],
						["es", "/es/login"],
						["pt-BR", "/pt-BR/login"],
					],
				},
				{
					pattern: "/signup",
					localized: [
						["en-US", "/signup"],
						["es", "/es/signup"],
						["pt-BR", "/pt-BR/signup"],
					],
				},
				{
					pattern: "/privacy",
					localized: [
						["en-US", "/privacy"],
						["es", "/es/privacy"],
						["pt-BR", "/pt-BR/privacy"],
					],
				},
				{
					pattern: "/terms",
					localized: [
						["en-US", "/terms"],
						["es", "/es/terms"],
						["pt-BR", "/pt-BR/terms"],
					],
				},
				{
					pattern: "/forgot-password",
					localized: [
						["en-US", "/forgot-password"],
						["es", "/es/forgot-password"],
						["pt-BR", "/pt-BR/forgot-password"],
					],
				},
				{
					pattern: "/reset-password",
					localized: [
						["en-US", "/reset-password"],
						["es", "/es/reset-password"],
						["pt-BR", "/pt-BR/reset-password"],
					],
				},
				{
					pattern: "/accept-invitation",
					localized: [
						["en-US", "/accept-invitation"],
						["es", "/es/accept-invitation"],
						["pt-BR", "/pt-BR/accept-invitation"],
					],
				},
				{
					pattern: "/select-organization",
					localized: [
						["en-US", "/select-organization"],
						["es", "/es/select-organization"],
						["pt-BR", "/pt-BR/select-organization"],
					],
				},
			],
		}),
		tailwindcss(),
		tanstackStart({}),
		viteReact(),
	],
}));

export default config;
