import type { MemberResponse } from "@/server/domains/organizations/schema";

function parseHM(value: string): number {
	const [hourPart, minutePart] = value.split(":");
	const hours = Number(hourPart);
	const minutes = Number(minutePart ?? 0);
	if (Number.isNaN(hours)) return 0;
	return hours + (Number.isNaN(minutes) ? 0 : minutes) / 60;
}

export function memberAvailability(
	member: MemberResponse,
	weekday: number,
): { from: number; to: number } | null {
	const day = member.working_hours?.find((d) => d.weekday === weekday);
	if (!day?.enabled || !day.from || !day.to) return null;
	const from = parseHM(day.from);
	const to = parseHM(day.to);
	if (to <= from) return null;
	return { from, to };
}
