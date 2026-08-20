import { SITE_URL } from "@/lib/constants";
import { getLocale, locales, localizeHref } from "@/paraglide/runtime";

const OG_LOCALE: Record<string, string> = {
	"en-US": "en_US",
	es: "es_LA",
	"pt-BR": "pt_BR",
};

export const seo = ({
	title,
	description,
	image,
	path,
	noindex,
	availableLocales,
}: {
	title: string;
	description?: string;
	image?: string;
	path: string;
	noindex?: boolean;
	availableLocales?: string[];
}) => {
	const DEFAULT_OG = `${SITE_URL}/og.png`;
	const currentLocale = getLocale();
	const canonical = `${SITE_URL}${localizeHref(path, { locale: currentLocale })}`;
	const imageUrl = image
		? image.startsWith("http")
			? image
			: `${SITE_URL}${image}`
		: DEFAULT_OG;

	const meta = [
		{ title },
		...(description ? [{ name: "description", content: description }] : []),
		...(noindex
			? [{ name: "robots", content: "noindex,nofollow" }]
			: [{ name: "robots", content: "index,follow" }]),
		{ property: "og:type", content: "website" },
		{ property: "og:site_name", content: "forgecmms" },
		{ property: "og:title", content: title },
		{ property: "og:url", content: canonical },
		{
			property: "og:locale",
			content: OG_LOCALE[currentLocale] ?? currentLocale,
		},
		...(description
			? [{ property: "og:description", content: description }]
			: []),
		...(imageUrl ? [{ property: "og:image", content: imageUrl }] : []),
		{
			name: "twitter:card",
			content: imageUrl ? "summary_large_image" : "summary",
		},
		{ name: "twitter:title", content: title },
		...(description
			? [{ name: "twitter:description", content: description }]
			: []),
		...(imageUrl ? [{ name: "twitter:image", content: imageUrl }] : []),
	];

	const hreflangLocales = availableLocales
		? locales.filter((l) => availableLocales.includes(l))
		: locales;

	const links = noindex
		? []
		: [
				{ rel: "canonical", href: canonical },
				...hreflangLocales.map((l) => ({
					rel: "alternate",
					hrefLang: l,
					href: `${SITE_URL}${localizeHref(path, { locale: l })}`,
				})),
				{
					rel: "alternate",
					hrefLang: "x-default",
					href: `${SITE_URL}${localizeHref(path, { locale: "en-US" })}`,
				},
			];

	return { meta, links };
};
