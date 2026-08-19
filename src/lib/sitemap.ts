import { SITE_URL } from "@/lib/constants";

const STATIC_ROUTES = ["/", "/privacy", "/terms"];

const LOCALES: Array<{ code: string; prefix: string }> = [
	{ code: "en-US", prefix: "" },
	{ code: "es", prefix: "/es" },
	{ code: "pt-BR", prefix: "/pt-BR" },
];

const DEFAULT_LOCALE = LOCALES[0];

function buildUrl(prefix: string, route: string): string {
	if (route === "/") {
		return `${SITE_URL}${prefix || "/"}`;
	}
	return `${SITE_URL}${prefix}${route}`;
}

function renderUrlEntry(
	loc: string,
	lastmod: string,
	variants: Array<{ code: string; loc: string }>,
	xDefault: string,
): string {
	const alternates = variants
		.map(
			(v) =>
				`    <xhtml:link rel="alternate" hreflang="${v.code}" href="${v.loc}" />`,
		)
		.join("\n");
	return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefault}" />
  </url>`;
}

function localizedUrlsForRoute(
	route: string,
	availableLocales: string[],
	lastmod: string,
): string[] {
	const localesToInclude = LOCALES.filter((l) =>
		availableLocales.includes(l.code),
	);
	const variants = localesToInclude.map(({ code, prefix }) => ({
		code,
		loc: buildUrl(prefix, route),
	}));
	const xDefault =
		variants.find((v) => v.code === DEFAULT_LOCALE.code)?.loc ??
		variants[0]?.loc ??
		buildUrl(DEFAULT_LOCALE.prefix, route);
	return variants.map(({ loc }) =>
		renderUrlEntry(loc, lastmod, variants, xDefault),
	);
}

export function generateSitemap(): string {
	const today = new Date().toISOString().split("T")[0];

	const staticUrls = STATIC_ROUTES.flatMap((route) =>
		localizedUrlsForRoute(
			route,
			LOCALES.map((l) => l.code),
			today,
		),
	);

	const urls = staticUrls.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}
