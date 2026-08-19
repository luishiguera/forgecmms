import { createFileRoute } from "@tanstack/react-router";
import { readSessionToken, resolveSession } from "@/server/auth/session";
import { resolveTenant } from "@/server/tenant";

const CACHE_TTL_MS = 30_000;
const CACHE_MAX_ENTRIES = 10_000;

const grants = new Map<string, number>();

const organizationOf = (uri: string) => {
	const match = /^\/organizations\/(\d+)\//.exec(uri);
	return match ? Number(match[1]) : undefined;
};

const isMember = async (token: string, organizationId: number) => {
	const key = `${token}:${organizationId}`;
	const expiresAt = grants.get(key);
	if (expiresAt && expiresAt > Date.now()) return true;

	const session = await resolveSession(token);
	if (!session) return false;

	try {
		await resolveTenant(session.userId, organizationId);
	} catch {
		return false;
	}

	if (grants.size >= CACHE_MAX_ENTRIES) grants.clear();
	grants.set(key, Date.now() + CACHE_TTL_MS);
	return true;
};

export const Route = createFileRoute("/api/storage-auth")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const organizationId = organizationOf(
					request.headers.get("x-forwarded-uri") ?? "",
				);
				if (!organizationId) return new Response(null, { status: 403 });

				const token = readSessionToken();
				if (!token) return new Response(null, { status: 401 });

				const granted = await isMember(token, organizationId);
				return new Response(null, { status: granted ? 204 : 403 });
			},
		},
	},
});
