export type OrgEntitySection =
	| "work-orders"
	| "parts"
	| "locations"
	| "assets"
	| "businesses";

export interface OrgEntityDetailLink {
	href: string;
	target: "_blank";
	rel: "noopener noreferrer";
}

export function buildOrgEntityDetailUrl(
	orgId: string,
	section: OrgEntitySection,
	id: number,
) {
	return `/org/${encodeURIComponent(orgId)}/${section}?id=${id}`;
}

export function buildOrgEntityDetailLink(
	orgId: string,
	section: OrgEntitySection,
	id: number,
): OrgEntityDetailLink {
	return {
		href: buildOrgEntityDetailUrl(orgId, section, id),
		target: "_blank",
		rel: "noopener noreferrer",
	};
}

export function openOrgEntityDetailInNewTab(
	orgId: string,
	section: OrgEntitySection,
	id: number,
) {
	if (typeof window === "undefined") return;
	window.open(
		buildOrgEntityDetailUrl(orgId, section, id),
		"_blank",
		"noopener,noreferrer",
	);
}
