import { describe, expect, it } from "vitest";
import type {
	FieldType,
	FormFieldConfig,
} from "../../domains/procedures/schema";
import {
	duration,
	formatDate,
	formatDateTime,
	formatScalar,
	formatWorkOrderDate,
	joinComma,
	newRenderCtx,
} from "./format";

const field = (type: FieldType): FormFieldConfig => ({
	id: "a",
	type,
	label: "",
	order: 0,
	validation: [],
});

const madrid = newRenderCtx("es", "Europe/Madrid");
const english = newRenderCtx("en-US", "UTC");

describe("report format", () => {
	it("falls back to the default locale and UTC", () => {
		const rc = newRenderCtx("fr", "Mars/Olympus");
		expect(rc.locale).toBe("en-US");
		expect(rc.timezone).toBe("UTC");
	});

	it("orders the date parts by locale", () => {
		expect(formatDate("2026-03-04", "en-US")).toBe("03/04/2026");
		expect(formatDate("2026-03-04", "es")).toBe("04/03/2026");
		expect(formatDate("2026-03-04T10:00:00Z", "es")).toBe("04/03/2026");
		expect(formatDate("not a date", "es")).toBe("not a date");
	});

	it("renders an instant in the report timezone and names it", () => {
		expect(formatDateTime("2026-08-10T07:00:00Z", madrid)).toBe(
			"10/08/2026 09:00 (Europe/Madrid)",
		);
		expect(formatDateTime("2026-08-10T07:00:00Z", english)).toBe(
			"08/10/2026 07:00 (UTC)",
		);
	});

	it("crosses the day boundary in the report timezone", () => {
		expect(formatDateTime("2026-08-10T23:30:00Z", madrid)).toBe(
			"11/08/2026 01:30 (Europe/Madrid)",
		);
	});

	it("keeps a date only value as a date", () => {
		expect(formatWorkOrderDate("2026-08-10", madrid)).toBe("10/08/2026");
		expect(formatWorkOrderDate(null, madrid)).toBe("");
	});

	it("reports the duration in hours and minutes", () => {
		expect(duration("2026-08-10T07:12:00Z", "2026-08-10T10:41:00Z", "—")).toBe(
			"3h 29m",
		);
		expect(duration("2026-08-10T07:12:00Z", "2026-08-10T07:50:00Z", "—")).toBe(
			"38m",
		);
		expect(duration(null, "2026-08-10T10:41:00Z", "—")).toBe("—");
		expect(duration("2026-08-10T10:41:00Z", "2026-08-10T07:12:00Z", "—")).toBe(
			"—",
		);
	});

	it("formats a scalar by field type", () => {
		expect(formatScalar(field("toggle"), true, madrid)).toBe("Sí");
		expect(formatScalar(field("toggle"), false, madrid)).toBe("No");
		expect(formatScalar(field("rating"), 4, madrid)).toBe("4/5");
		expect(
			formatScalar(
				{
					...field("rating"),
					rating_config: { max_rating: 10, icon: "star" },
				},
				4,
				madrid,
			),
		).toBe("4/10");
		expect(
			formatScalar(
				{
					...field("linear_scale"),
					scale_config: { min: 1, max: 10 },
				},
				7,
				madrid,
			),
		).toBe("7/10");
		expect(formatScalar(field("checkboxes"), ["x", "y"], madrid)).toBe("x, y");
		expect(
			formatScalar(
				field("file"),
				["https://cdn.example.com/a/b/report.pdf?token=1"],
				madrid,
			),
		).toBe("report.pdf");
		expect(formatScalar(field("short_text"), null, madrid)).toBe(
			"Sin respuesta",
		);
	});

	it("drops the empty parts of an address", () => {
		expect(joinComma("Calle 1", "", "Madrid", "")).toBe("Calle 1, Madrid");
	});
});
