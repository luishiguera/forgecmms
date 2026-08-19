import handler from "@tanstack/react-start/server-entry";
import { generateSitemap } from "./lib/sitemap";
import { paraglideMiddleware } from "./paraglide/server.js";
import { stopSenderBoss } from "./server/jobs/boss";

export default {
	async shutdown(): Promise<void> {
		await stopSenderBoss();
	},
	fetch(req: Request): Promise<Response> {
		const url = new URL(req.url);
		if (url.pathname === "/sitemap.xml") {
			return Promise.resolve(
				new Response(generateSitemap(), {
					headers: {
						"Content-Type": "application/xml; charset=utf-8",
						"Cache-Control": "public, max-age=3600",
					},
				}),
			);
		}
		return paraglideMiddleware(req, () => handler.fetch(req));
	},
};
