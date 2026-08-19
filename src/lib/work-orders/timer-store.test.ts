import { describe, expect, it } from "vitest";
import {
	adopt,
	EMPTY_STATE,
	elapsedMs,
	elapsedSince,
	formatElapsed,
	pause,
	reset,
	restore,
	start,
	tick,
} from "./timer-store";

const T0 = 1_800_000_000_000;

describe("start", () => {
	it("starts a fresh timer", () => {
		const state = start(EMPTY_STATE, 5, T0);
		expect(state.activeId).toBe(5);
		expect(state.entries[5]).toEqual({
			startedAtMs: T0,
			accumulatedMs: 0,
			isRunning: true,
		});
	});

	it("pauses the running one when another starts", () => {
		let state = start(EMPTY_STATE, 5, T0);
		state = start(state, 6, T0 + 30_000);

		expect(state.activeId).toBe(6);
		expect(state.entries[5]).toEqual({
			startedAtMs: T0 + 30_000,
			accumulatedMs: 30_000,
			isRunning: false,
		});
		expect(state.entries[6].isRunning).toBe(true);
	});

	it("resumes on top of the time already accumulated", () => {
		let state = start(EMPTY_STATE, 5, T0);
		state = pause(state, 5, T0 + 10_000);
		state = start(state, 5, T0 + 60_000);

		expect(state.entries[5]).toEqual({
			startedAtMs: T0 + 60_000,
			accumulatedMs: 10_000,
			isRunning: true,
		});
		expect(elapsedMs(state.entries[5], T0 + 65_000)).toBe(15_000);
	});

	it("is a no-op on a timer that already runs", () => {
		const state = start(EMPTY_STATE, 5, T0);
		expect(start(state, 5, T0 + 5_000)).toBe(state);
	});
});

describe("adopt", () => {
	it("takes over a work order that the server already started", () => {
		const state = adopt(EMPTY_STATE, 5, T0, T0 + 90_000);

		expect(state.activeId).toBe(5);
		expect(elapsedMs(state.entries[5], T0 + 90_000)).toBe(90_000);
		expect(pause(state, 5, T0 + 90_000).entries[5].accumulatedMs).toBe(90_000);
	});

	it("pauses the running one and leaves a known timer alone", () => {
		let state = start(EMPTY_STATE, 6, T0);
		state = adopt(state, 5, T0 - 60_000, T0 + 30_000);

		expect(state.entries[6].isRunning).toBe(false);
		expect(adopt(state, 5, T0, T0 + 60_000)).toBe(state);
	});
});

describe("pause and reset", () => {
	it("freezes the elapsed time", () => {
		let state = start(EMPTY_STATE, 5, T0);
		state = pause(state, 5, T0 + 90_000);

		expect(state.activeId).toBeUndefined();
		expect(elapsedMs(state.entries[5], T0 + 900_000)).toBe(90_000);
	});

	it("ignores a pause on a timer that is not running", () => {
		const state = pause(EMPTY_STATE, 5, T0);
		expect(state).toBe(EMPTY_STATE);
	});

	it("drops the entry on reset", () => {
		let state = start(EMPTY_STATE, 5, T0);
		state = reset(state, 5, T0 + 1_000);
		expect(state.entries[5]).toBeUndefined();
		expect(state.activeId).toBeUndefined();
	});
});

describe("restore", () => {
	it("keeps counting a timer that was running when the tab closed", () => {
		const restored = restore(
			{ 5: { startedAtMs: T0, accumulatedMs: 5_000, isRunning: true } },
			T0 + 60_000,
		);

		expect(restored.activeId).toBe(5);
		expect(restored.entries[5]).toEqual({
			startedAtMs: T0 + 60_000,
			accumulatedMs: 65_000,
			isRunning: true,
		});
		expect(elapsedMs(restored.entries[5], T0 + 61_000)).toBe(66_000);
	});

	it("leaves a paused timer alone", () => {
		const entry = { startedAtMs: T0, accumulatedMs: 5_000, isRunning: false };
		const restored = restore({ 5: entry }, T0 + 60_000);
		expect(restored.entries[5]).toEqual(entry);
		expect(restored.activeId).toBeUndefined();
	});

	it("survives a clock that went backwards", () => {
		const restored = restore(
			{ 5: { startedAtMs: T0, accumulatedMs: 1_000, isRunning: true } },
			T0 - 60_000,
		);
		expect(restored.entries[5].accumulatedMs).toBe(1_000);
	});
});

describe("tick", () => {
	it("moves the clock even when nothing runs", () => {
		expect(tick(EMPTY_STATE, T0).nowMs).toBe(T0);
		const running = start(EMPTY_STATE, 5, T0);
		expect(tick(running, T0 + 1_000).nowMs).toBe(T0 + 1_000);
	});

	it("keeps the same state when the clock did not move", () => {
		expect(tick(EMPTY_STATE, EMPTY_STATE.nowMs)).toBe(EMPTY_STATE);
	});
});

describe("elapsedSince", () => {
	it("counts from the server start time", () => {
		const startedAt = new Date(T0).toISOString();
		expect(elapsedSince(startedAt, T0 + 90_000)).toBe(90_000);
	});

	it("returns zero without a start time or before it", () => {
		expect(elapsedSince(null, T0)).toBe(0);
		expect(elapsedSince("", T0)).toBe(0);
		expect(elapsedSince("not a date", T0)).toBe(0);
		expect(elapsedSince(new Date(T0).toISOString(), T0 - 1_000)).toBe(0);
	});
});

describe("formatElapsed", () => {
	it("pads to hours, minutes and seconds", () => {
		expect(formatElapsed(0)).toBe("00:00:00");
		expect(formatElapsed(61_000)).toBe("00:01:01");
		expect(formatElapsed(3_723_000)).toBe("01:02:03");
		expect(formatElapsed(360_000_000)).toBe("100:00:00");
	});
});
