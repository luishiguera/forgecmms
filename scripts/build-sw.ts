import { resolve } from "node:path";
import { build } from "vite";
import { injectManifest } from "workbox-build";

const root = resolve(import.meta.dirname, "..");
const swSrc = resolve(root, "dist/sw-src.js");
const swDest = resolve(root, "dist/client/sw.js");

await build({
	root,
	configFile: false,
	logLevel: "warn",
	build: {
		lib: {
			entry: resolve(root, "src/sw.ts"),
			formats: ["es"],
			fileName: () => "sw-src.js",
		},
		outDir: "dist",
		emptyOutDir: false,
		copyPublicDir: false,
		minify: true,
		rollupOptions: {
			output: { codeSplitting: false },
		},
	},
});

const { count, size, warnings } = await injectManifest({
	swSrc,
	swDest,
	globDirectory: resolve(root, "dist/client"),
	globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,woff2}"],
	globIgnores: ["**/mapbox-gl-*.js", "sw.js"],
	maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
});

for (const warning of warnings) console.warn(warning);

const megabytes = (size / 1024 / 1024).toFixed(2);
console.log(`sw.js precaches ${count} files, ${megabytes} MB`);
