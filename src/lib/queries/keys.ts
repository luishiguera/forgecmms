export function entityKeys(domain: string) {
	return {
		all: (orgId: string) => ["organization", orgId, domain] as const,
		lists: (orgId: string) => ["organization", orgId, domain, "list"] as const,
		list: (orgId: string, params: unknown) =>
			["organization", orgId, domain, "list", params] as const,
		infinite: (orgId: string, params: unknown) =>
			["organization", orgId, domain, "list", "infinite", params] as const,
		detail: (orgId: string, id: number) =>
			["organization", orgId, domain, "detail", id] as const,
	};
}
