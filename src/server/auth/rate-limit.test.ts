import { beforeEach, describe, expect, it } from "vitest";
import { consume, resetBuckets } from "./rate-limit";

beforeEach(() => resetBuckets());

describe("auth rate limit", () => {
	it("allows a burst of ten then refuses the eleventh", () => {
		const now = Date.now();
		for (let attempt = 0; attempt < 10; attempt += 1) {
			expect(consume("1.2.3.4", now)).toBe(true);
		}
		expect(consume("1.2.3.4", now)).toBe(false);
	});

	it("refills at one token every five seconds", () => {
		const now = Date.now();
		for (let attempt = 0; attempt < 10; attempt += 1) consume("1.2.3.4", now);

		expect(consume("1.2.3.4", now + 4_000)).toBe(false);
		expect(consume("1.2.3.4", now + 5_000)).toBe(true);
	});

	it("never refills past the burst size", () => {
		const now = Date.now();
		consume("1.2.3.4", now);

		const later = now + 60 * 60 * 1000;
		for (let attempt = 0; attempt < 10; attempt += 1) {
			expect(consume("1.2.3.4", later)).toBe(true);
		}
		expect(consume("1.2.3.4", later)).toBe(false);
	});

	it("keeps one caller's exhausted bucket away from another", () => {
		const now = Date.now();
		for (let attempt = 0; attempt < 10; attempt += 1) consume("1.2.3.4", now);

		expect(consume("1.2.3.4", now)).toBe(false);
		expect(consume("5.6.7.8", now)).toBe(true);
	});

	it("forgets a bucket that has been idle past the expiry window", () => {
		const now = Date.now();
		for (let attempt = 0; attempt < 10; attempt += 1) consume("1.2.3.4", now);
		expect(consume("1.2.3.4", now)).toBe(false);

		expect(consume("9.9.9.9", now + 4 * 60 * 1000)).toBe(true);
		expect(consume("1.2.3.4", now + 4 * 60 * 1000)).toBe(true);
	});
});
