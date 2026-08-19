import { GITHUB_LICENSE_URL, GITHUB_URL, SITE_URL } from "@/lib/constants";

const ORG_ID = `${SITE_URL}/#organization`;
const SOFTWARE_ID = `${SITE_URL}/#software`;

const SOCIAL_PROFILES = [GITHUB_URL];

export function organizationSchema() {
	return {
		"@type": "Organization",
		"@id": ORG_ID,
		name: "forgecmms",
		url: SITE_URL,
		logo: `${SITE_URL}/logo-square.png`,
		sameAs: SOCIAL_PROFILES,
	};
}

export function softwareApplicationSchema({
	description,
	priceUSD,
}: {
	description: string;
	priceUSD: number;
}) {
	return {
		"@type": "SoftwareApplication",
		"@id": SOFTWARE_ID,
		name: "forgecmms",
		applicationCategory: "BusinessApplication",
		applicationSubCategory: "FieldServiceManagement",
		operatingSystem: "Web, Android",
		url: SITE_URL,
		description,
		license: GITHUB_LICENSE_URL,
		softwareHelp: { "@type": "CreativeWork", url: GITHUB_URL },
		publisher: { "@id": ORG_ID },
		offers: {
			"@type": "Offer",
			price: String(priceUSD),
			priceCurrency: "USD",
			category: "subscription",
			availability: "https://schema.org/InStock",
		},
	};
}

export function jsonLdScript(nodes: Array<Record<string, unknown>>): {
	type: string;
	children: string;
} {
	const payload = {
		"@context": "https://schema.org",
		"@graph": nodes,
	};
	return {
		type: "application/ld+json",
		children: JSON.stringify(payload),
	};
}
