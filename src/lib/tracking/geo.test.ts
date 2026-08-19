import { describe, expect, it } from "vitest";
import { distanceMeters, type Fix, isMove, isSendable } from "./geo";

const fix = (latitude: number, longitude: number, timestamp = "t0"): Fix => ({
	latitude,
	longitude,
	timestamp,
});

describe("distanceMeters", () => {
	it("is zero for the same point", () => {
		expect(distanceMeters(fix(40.4168, -3.7038), fix(40.4168, -3.7038))).toBe(
			0,
		);
	});

	it("matches a known distance", () => {
		const madrid = fix(40.4168, -3.7038);
		const barcelona = fix(41.3874, 2.1686);
		expect(distanceMeters(madrid, barcelona) / 1000).toBeCloseTo(505, 0);
	});

	it("measures a small step in metres", () => {
		const start = fix(40.4168, -3.7038);
		const north = fix(40.4168 + 0.00018, -3.7038);
		expect(distanceMeters(start, north)).toBeCloseTo(20, 0);
	});

	it("does not blow up across the antimeridian", () => {
		expect(distanceMeters(fix(0, 179.999), fix(0, -179.999))).toBeLessThan(300);
	});
});

describe("isMove", () => {
	it("accepts the first fix", () => {
		expect(isMove(undefined, fix(40.4168, -3.7038))).toBe(true);
	});

	it("drops a fix that did not move 20 metres", () => {
		const start = fix(40.4168, -3.7038);
		expect(isMove(start, fix(40.4168 + 0.00005, -3.7038))).toBe(false);
		expect(isMove(start, fix(40.4168 + 0.0002, -3.7038))).toBe(true);
	});
});

describe("isSendable", () => {
	it("refuses to send the same fix twice", () => {
		const current = fix(40.4168, -3.7038, "2026-08-13T10:00:00.000Z");
		expect(isSendable(current, undefined)).toBe(true);
		expect(isSendable(current, "2026-08-13T10:00:00.000Z")).toBe(false);
		expect(isSendable(current, "2026-08-13T09:58:00.000Z")).toBe(true);
	});

	it("refuses to send nothing", () => {
		expect(isSendable(undefined, undefined)).toBe(false);
	});
});
