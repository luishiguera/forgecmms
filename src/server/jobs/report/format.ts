import type { FormFieldConfig } from "../../domains/procedures/schema";
import type { JsonValue } from "../../json";
import {
	DEFAULT_LOCALE,
	hasLocale,
	newTranslator,
	type Translator,
} from "./i18n";

export type RenderCtx = {
	locale: string;
	timezone: string;
	t: Translator;
};

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export const newRenderCtx = (language: string, timezone: string): RenderCtx => {
	let zone = "UTC";
	if (timezone) {
		try {
			new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
			zone = timezone;
		} catch {
			zone = "UTC";
		}
	}

	const locale = hasLocale(language) ? language : DEFAULT_LOCALE;
	return { locale, timezone: zone, t: newTranslator(locale) };
};

export const toStr = (value: JsonValue | undefined): string => {
	if (value === null || value === undefined) return "";
	if (typeof value === "string") return value;
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
};

export const toStrings = (value: JsonValue | undefined): string[] =>
	Array.isArray(value) ? value.map(toStr) : [];

export const joinAny = (value: JsonValue | undefined): string =>
	Array.isArray(value) ? value.map(toStr).join(", ") : toStr(value);

export const nonEmpty = (...items: string[]) =>
	items.filter((item) => item.trim() !== "");

export const joinComma = (...items: string[]) => nonEmpty(...items).join(", ");

const orDefault = (value: number | undefined, fallback: number) =>
	value ? value : fallback;

export const formatNumber = (value: JsonValue | undefined) => {
	if (typeof value === "number") {
		return Number.isInteger(value) ? String(value) : String(value);
	}
	return toStr(value);
};

export const formatDate = (value: string, locale: string) => {
	if (!value) return "";

	const match = ISO_DATE.exec(value.split("T")[0]);
	if (!match) return value;

	const [, year, month, day] = match;
	return locale === "en-US"
		? `${month}/${day}/${year}`
		: `${day}/${month}/${year}`;
};

export const formatDateTime = (value: string, rc: RenderCtx) => {
	if (!value) return "";

	const instant = new Date(value);
	if (Number.isNaN(instant.getTime())) return value;

	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: rc.timezone,
		hourCycle: "h23",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).formatToParts(instant);

	const part = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((entry) => entry.type === type)?.value ?? "";

	const date = formatDate(
		`${part("year")}-${part("month")}-${part("day")}`,
		rc.locale,
	);

	return `${date} ${part("hour")}:${part("minute")} (${rc.timezone})`;
};

export const formatWorkOrderDate = (
	value: string | null | undefined,
	rc: RenderCtx,
) => {
	if (!value) return "";
	return ISO_INSTANT.test(value)
		? formatDateTime(value, rc)
		: formatDate(value, rc.locale);
};

export const duration = (
	start: string | null,
	end: string | null,
	dash: string,
) => {
	if (!start || !end) return dash;

	const from = new Date(start).getTime();
	const to = new Date(end).getTime();
	if (Number.isNaN(from) || Number.isNaN(to) || to < from) return dash;

	const minutes = Math.floor((to - from) / 60_000);
	const hours = Math.floor(minutes / 60);

	return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
};

const baseName = (value: string) => value.split("?")[0].split("/").pop() ?? "";

export const formatScalar = (
	field: FormFieldConfig,
	value: JsonValue | undefined,
	rc: RenderCtx,
) => {
	if (value === null || value === undefined) return rc.t("no_response");

	switch (field.type) {
		case "number":
			return formatNumber(value);
		case "checkboxes":
		case "multi_select":
			return toStrings(value).join(", ");
		case "toggle":
			if (typeof value === "boolean") return value ? rc.t("yes") : rc.t("no");
			break;
		case "rating":
			return `${formatNumber(value)}/${orDefault(field.rating_config?.max_rating, 5)}`;
		case "linear_scale":
			return `${formatNumber(value)}/${orDefault(field.scale_config?.max, 5)}`;
		case "date":
			return formatDate(toStr(value), rc.locale);
		case "datetime":
			return formatDateTime(toStr(value), rc);
		case "file":
			return toStrings(value).map(baseName).join(", ");
	}

	return toStr(value);
};
