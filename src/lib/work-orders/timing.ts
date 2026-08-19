import { durationBetween, durationLabel } from "@/utils/day";

const ON_TIME_MINUTES = 5;

export type TimingDelta = {
	kind: "on_time" | "early" | "late";
	duration: string;
};

export const timingDelta = (
	planned: string | null,
	actual: string | null,
): TimingDelta | null => {
	if (!planned || !actual) return null;

	const minutes = Math.round(
		(new Date(actual).getTime() - new Date(planned).getTime()) / 60_000,
	);
	if (Number.isNaN(minutes)) return null;

	const size = Math.abs(minutes);
	if (size <= ON_TIME_MINUTES) return { kind: "on_time", duration: "" };

	return {
		kind: minutes < 0 ? "early" : "late",
		duration: durationLabel(size),
	};
};

export const executionDuration = (
	startedAt: string | null,
	closedAt: string | null,
) => durationBetween(startedAt, closedAt);
