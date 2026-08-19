import { is24hFormat } from "@/lib/time-format";
import * as m from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

export type DateFormatStyle =
	| "short"
	| "medium"
	| "long"
	| "month"
	| "relative";

export interface FormatDateOptions {
	style?: DateFormatStyle;
	timezone?: string;
	includeTime?: boolean;
}

const TZ_STORAGE_KEY = "user_timezone";

function getBrowserTimezone(): string {
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function setUserTimezone(timezone: string | null | undefined): void {
	if (typeof window === "undefined" || !timezone) return;
	try {
		window.localStorage.setItem(TZ_STORAGE_KEY, timezone);
	} catch {
		return;
	}
}

export function getUserTimezone(): string {
	if (typeof window !== "undefined") {
		try {
			const stored = window.localStorage.getItem(TZ_STORAGE_KEY);
			if (stored) return stored;
		} catch {
			return getBrowserTimezone();
		}
	}
	return getBrowserTimezone();
}

export function formatDate(
	date: string | Date,
	options: FormatDateOptions = {},
): string {
	const { style = "medium", timezone, includeTime } = options;
	const locale = getLocale();
	const tz = timezone ?? getUserTimezone();
	const d = typeof date === "string" ? new Date(date) : date;

	if (style === "relative") {
		return formatRelativeDate(d, locale, tz);
	}

	const styleOptions: Record<
		Exclude<DateFormatStyle, "relative">,
		Intl.DateTimeFormatOptions
	> = {
		short: { month: "short", day: "numeric" },
		medium: { month: "short", day: "numeric", year: "numeric" },
		long: { month: "long", day: "numeric", year: "numeric" },
		month: { month: "short" },
	};

	const timeOptions: Intl.DateTimeFormatOptions = includeTime
		? { hour: "2-digit", minute: "2-digit", hour12: !is24hFormat() }
		: {};

	return d.toLocaleDateString(locale, {
		timeZone: tz,
		...styleOptions[style],
		...timeOptions,
	});
}

function formatRelativeDate(
	date: Date,
	locale: string,
	timezone: string,
): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays === 0) {
		return date.toLocaleTimeString(locale, {
			timeZone: timezone,
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
	}

	if (diffDays === 1) {
		return m.date_yesterday();
	}

	if (diffDays < 7) {
		return date.toLocaleDateString(locale, {
			timeZone: timezone,
			weekday: "long",
		});
	}

	return date.toLocaleDateString(locale, {
		timeZone: timezone,
		month: "short",
		day: "numeric",
		year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
	});
}
