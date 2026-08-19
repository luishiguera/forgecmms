import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import {
	cleanupOutdatedCaches,
	type PrecacheEntry,
	precacheAndRoute,
} from "workbox-precaching";
import {
	registerRoute,
	setCatchHandler,
	setDefaultHandler,
} from "workbox-routing";
import { CacheFirst, NetworkOnly } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope & {
	__WB_MANIFEST: Array<PrecacheEntry | string>;
	skipWaiting(): Promise<void>;
};

const OFFLINE_URL = "/offline.html";
const HEAVY_ASSET_CACHE = "heavy-assets";
const HEAVY_ASSET_ENTRIES = 8;
const HEAVY_ASSET_DAYS = 30;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
clientsClaim();

self.skipWaiting();

registerRoute(
	({ url, sameOrigin }) =>
		sameOrigin && url.pathname.startsWith("/assets/maplibre-gl-"),
	new CacheFirst({
		cacheName: HEAVY_ASSET_CACHE,
		plugins: [
			new ExpirationPlugin({
				maxEntries: HEAVY_ASSET_ENTRIES,
				maxAgeSeconds: HEAVY_ASSET_DAYS * 24 * 60 * 60,
				purgeOnQuotaError: true,
			}),
		],
	}),
);

setDefaultHandler(new NetworkOnly());

setCatchHandler(async ({ request }) => {
	if (request.mode !== "navigate") return Response.error();
	const cached = await caches.match(OFFLINE_URL, { ignoreSearch: true });
	return cached ?? Response.error();
});
