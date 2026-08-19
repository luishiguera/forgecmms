import { defineConfig } from "vite";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	build: {
		ssr: "worker.ts",
		outDir: "dist/worker",
		emptyOutDir: true,
		target: "node24",
		rollupOptions: {
			output: {
				entryFileNames: "worker.js",
			},
		},
	},
});
