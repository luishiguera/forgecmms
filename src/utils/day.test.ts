import { describe, expect, it } from "vitest";
import {
	addDays,
	dayKey,
	durationLabel,
	minutesOfDay,
	safeTimezone,
	startOfDay,
	startOfNextDay,
	timeLabel,
	wallToInstant,
	weekStartKey,
} from "./day";

const MADRID = "Europe/Madrid";
const NEW_YORK = "America/New_York";
const KATHMANDU = "Asia/Kathmandu";

describe("safeTimezone", () => {
	it("falls back to UTC for empty or invalid zones", () => {
		expect(safeTimezone("")).toBe("UTC");
		expect(safeTimezone(null)).toBe("UTC");
		expect(safeTimezone("Mars/Olympus")).toBe("UTC");
		expect(safeTimezone(MADRID)).toBe(MADRID);
	});
});

describe("dayKey", () => {
	it("uses the zone, not the machine, to decide which day an instant is", () => {
		const instant = "2026-03-18T03:30:00Z";
		expect(dayKey(instant, MADRID)).toBe("2026-03-18");
		expect(dayKey(instant, NEW_YORK)).toBe("2026-03-17");
	});

	it("handles zones with a half hour offset", () => {
		expect(dayKey("2026-03-17T18:20:00Z", KATHMANDU)).toBe("2026-03-18");
	});
});

describe("wallToInstant", () => {
	it("converts a wall time in a zone to the right instant", () => {
		expect(wallToInstant("2026-01-15", 9 * 60, MADRID).toISOString()).toBe(
			"2026-01-15T08:00:00.000Z",
		);
		expect(wallToInstant("2026-07-15", 9 * 60, MADRID).toISOString()).toBe(
			"2026-07-15T07:00:00.000Z",
		);
	});

	it("keeps the wall time across a spring forward transition", () => {
		const before = wallToInstant("2026-03-29", 60, MADRID);
		const after = wallToInstant("2026-03-29", 4 * 60, MADRID);
		expect(timeLabel(before, MADRID)).toBe("01:00");
		expect(timeLabel(after, MADRID)).toBe("04:00");
		expect(after.getTime() - before.getTime()).toBe(2 * 3_600_000);
	});
});

describe("startOfDay", () => {
	it("is midnight in the zone, not in UTC", () => {
		expect(startOfDay("2026-03-18", MADRID).toISOString()).toBe(
			"2026-03-17T23:00:00.000Z",
		);
		expect(startOfDay("2026-03-18", NEW_YORK).toISOString()).toBe(
			"2026-03-18T04:00:00.000Z",
		);
	});

	it("gives a 23 hour day when the clocks move forward", () => {
		const start = startOfDay("2026-03-29", MADRID);
		const next = startOfNextDay("2026-03-29", MADRID);
		expect(next.getTime() - start.getTime()).toBe(23 * 3_600_000);
	});
});

describe("addDays and weekStartKey", () => {
	it("crosses month and year boundaries", () => {
		expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
		expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
		expect(addDays("2026-03-18", 7)).toBe("2026-03-25");
	});

	it("starts the week on monday", () => {
		expect(weekStartKey("2026-03-18")).toBe("2026-03-16");
		expect(weekStartKey("2026-03-16")).toBe("2026-03-16");
		expect(weekStartKey("2026-03-22")).toBe("2026-03-16");
	});
});

describe("minutesOfDay and timeLabel", () => {
	it("reads the clock in the zone", () => {
		expect(minutesOfDay("2026-03-18T13:45:00Z", MADRID)).toBe(14 * 60 + 45);
		expect(minutesOfDay("2026-03-18T13:45:00Z", NEW_YORK)).toBe(9 * 60 + 45);
		expect(timeLabel("2026-03-18T13:45:00Z", NEW_YORK)).toBe("09:45");
	});

	it("keeps midnight as 00:00 rather than 24:00", () => {
		expect(timeLabel(startOfDay("2026-03-18", MADRID), MADRID)).toBe("00:00");
		expect(minutesOfDay(startOfDay("2026-03-18", MADRID), MADRID)).toBe(0);
	});
});

describe("durationLabel", () => {
	it("drops the empty part", () => {
		expect(durationLabel(45)).toBe("45m");
		expect(durationLabel(120)).toBe("2h");
		expect(durationLabel(90)).toBe("1h 30m");
	});
});
