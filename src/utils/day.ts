import { is24hFormat } from "@/lib/time-format";

export const safeTimezone = (timezone: string | null | undefined) => {
	if (!timezone) return "UTC";
	try {
		new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
		return timezone;
	} catch {
		return "UTC";
	}
};

const offsetAt = (utcMs: number, timeZone: string) => {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone,
		hourCycle: "h23",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	}).formatToParts(new Date(utcMs));

	const value = (type: Intl.DateTimeFormatPartTypes) =>
		Number(parts.find((part) => part.type === type)?.value);

	const asUtc = Date.UTC(
		value("year"),
		value("month") - 1,
		value("day"),
		value("hour"),
		value("minute"),
		value("second"),
	);

	return asUtc - utcMs;
};

export const wallToInstant = (
	day: string,
	minutes: number,
	timezone: string,
) => {
	const zone = safeTimezone(timezone);
	const wall = Date.parse(`${day}T00:00:00Z`) + minutes * 60_000;
	const firstPass = wall - offsetAt(wall, zone);
	return new Date(wall - offsetAt(firstPass, zone));
};

export const addDays = (day: string, amount: number) => {
	const date = new Date(`${day}T00:00:00Z`);
	date.setUTCDate(date.getUTCDate() + amount);
	return date.toISOString().slice(0, 10);
};

export const startOfDay = (day: string, timezone: string) =>
	wallToInstant(day, 0, timezone);

export const startOfNextDay = (day: string, timezone: string) =>
	wallToInstant(addDays(day, 1), 0, timezone);

export const dayKey = (date: Date | string, timezone: string) =>
	new Intl.DateTimeFormat("en-CA", {
		timeZone: safeTimezone(timezone),
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(new Date(date));

export const todayKey = (timezone: string) => dayKey(new Date(), timezone);

export const weekStartKey = (day: string) => {
	const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
	return addDays(day, -((weekday + 6) % 7));
};

export const minutesOfDay = (date: Date | string, timezone: string) => {
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone: safeTimezone(timezone),
		hourCycle: "h23",
		hour: "2-digit",
		minute: "2-digit",
	})
		.format(new Date(date))
		.split(":");
	return Number(parts[0]) * 60 + Number(parts[1]);
};

export const timeLabel = (date: Date | string, timezone: string) =>
	is24hFormat()
		? new Intl.DateTimeFormat("en-GB", {
				timeZone: safeTimezone(timezone),
				hourCycle: "h23",
				hour: "2-digit",
				minute: "2-digit",
			}).format(new Date(date))
		: new Intl.DateTimeFormat("en-US", {
				timeZone: safeTimezone(timezone),
				hourCycle: "h12",
				hour: "numeric",
				minute: "2-digit",
			}).format(new Date(date));

export const timeParts = (date: Date | string, timezone: string) => {
	if (is24hFormat()) return { time: timeLabel(date, timezone) };

	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: safeTimezone(timezone),
		hourCycle: "h12",
		hour: "numeric",
		minute: "2-digit",
	}).formatToParts(new Date(date));

	const part = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((entry) => entry.type === type)?.value ?? "";

	return {
		time: `${part("hour")}:${part("minute")}`,
		meridiem: part("dayPeriod").toUpperCase(),
	};
};

export const durationLabel = (minutes: number) => {
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours === 0) return `${rest}m`;
	if (rest === 0) return `${hours}h`;
	return `${hours}h ${rest}m`;
};

export const durationBetween = (
	start: Date | string | null | undefined,
	end: Date | string | null | undefined,
) => {
	if (!start || !end) return null;
	const ms = new Date(end).getTime() - new Date(start).getTime();
	if (Number.isNaN(ms) || ms < 0) return null;
	return durationLabel(Math.round(ms / 60_000));
};
