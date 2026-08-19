import { openAsBlob } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { type ServerMiddleware, serve } from "srvx";
import { runMigrations } from "./src/server/db/migrate.ts";

const clientDir = resolve(
	fileURLToPath(new URL("./dist/client", import.meta.url)),
);
const clientPrefix = clientDir + sep;

const MIME_TYPES: Record<string, string> = {
	".css": "text/css; charset=utf-8",
	".html": "text/html; charset=utf-8",
	".ico": "image/vnd.microsoft.icon",
	".jpg": "image/jpeg",
	".js": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".map": "application/json; charset=utf-8",
	".png": "image/png",
	".svg": "image/svg+xml",
	".txt": "text/plain; charset=utf-8",
	".webmanifest": "application/manifest+json",
	".webp": "image/webp",
	".woff2": "font/woff2",
	".xml": "application/xml; charset=utf-8",
};

const IMMUTABLE = "public, max-age=31536000, immutable";
const REVALIDATE = "public, max-age=0, must-revalidate";

const serveClient: ServerMiddleware = async (request, next) => {
	if (request.method !== "GET" && request.method !== "HEAD") return next();

	const { pathname } = new URL(request.url);
	const filePath = join(clientDir, pathname);
	if (!filePath.startsWith(clientPrefix)) return next();

	const stats = await stat(filePath).catch(() => null);
	if (!stats?.isFile()) return next();

	const etag = `W/"${stats.size.toString(36)}-${stats.mtimeMs.toString(36)}"`;
	const headers = new Headers({
		"Cache-Control": pathname.startsWith("/assets/") ? IMMUTABLE : REVALIDATE,
		"Content-Type": MIME_TYPES[extname(filePath)] ?? "application/octet-stream",
		ETag: etag,
	});

	if (request.headers.get("if-none-match") === etag) {
		return new Response(null, { status: 304, headers });
	}

	headers.set("Content-Length", String(stats.size));
	if (request.method === "HEAD") return new Response(null, { headers });

	return new Response(await openAsBlob(filePath), { headers });
};

await runMigrations();

const entry = await import(
	new URL("./dist/server/server.js", import.meta.url).href
);

const server = serve({
	fetch: (request: Request) => entry.default.fetch(request),
	middleware: [serveClient],
});

await server.ready();

const SHUTDOWN_GRACE_MS = 5000;
let shuttingDown = false;

const shutdown = async () => {
	if (shuttingDown) return;
	shuttingDown = true;

	const force = setTimeout(() => server.close(true), SHUTDOWN_GRACE_MS);
	await server.close();
	clearTimeout(force);
	await entry.default.shutdown();
	process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
