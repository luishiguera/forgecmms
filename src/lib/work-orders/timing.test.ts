import { describe, expect, it } from "vitest";
import { timingDelta } from "./timing";

describe("timingDelta", () => {
	it("calls a five minute gap on time", () => {
		expect(timingDelta("2026-03-18T09:00:00Z", "2026-03-18T09:05:00Z")).toEqual(
			{ kind: "on_time", duration: "" },
		);
	});

	it("reads an earlier start as early", () => {
		expect(timingDelta("2026-03-18T09:00:00Z", "2026-03-18T08:30:00Z")).toEqual(
			{ kind: "early", duration: "30m" },
		);
	});

	it("reads a later close as late", () => {
		expect(timingDelta("2026-03-18T09:00:00Z", "2026-03-18T10:30:00Z")).toEqual(
			{ kind: "late", duration: "1h 30m" },
		);
	});

	it("gives nothing without both ends", () => {
		expect(timingDelta("2026-03-18T09:00:00Z", null)).toBeNull();
	});
});
