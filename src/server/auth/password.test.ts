import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

const goHashes = [
	{
		plain: "correct-horse",
		encoded:
			"$argon2id$v=19$m=65536,t=3,p=4$HQf3bUl+HK27DMwyuZwaUw$YoSkRjmJFLCRT37oPlTLgYsck5n0Fgb8u1Fbto9KA38",
	},
	{
		plain: "9d*cE0MQqb2fKX*Cb3",
		encoded:
			"$argon2id$v=19$m=65536,t=3,p=4$weetEhChbm5BkfXfWajHAA$V48X9cyamUXaLb66G0eCe8QbNwUMI7TWyy9wZcR+utU",
	},
];

describe("password", () => {
	it("verifies hashes written by the Go backend", async () => {
		for (const { plain, encoded } of goHashes) {
			expect(await verifyPassword(plain, encoded)).toBe(true);
		}
	});

	it("rejects a wrong password against a Go hash", async () => {
		expect(await verifyPassword("wrong", goHashes[0].encoded)).toBe(false);
	});

	it("rejects an empty stored hash", async () => {
		expect(await verifyPassword("anything", "")).toBe(false);
	});

	it("rejects a malformed stored hash", async () => {
		expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
	});

	it("writes hashes with the same parameters Go used", async () => {
		const encoded = await hashPassword("some-password");
		expect(encoded.startsWith("$argon2id$v=19$m=65536,t=3,p=4$")).toBe(true);
		expect(await verifyPassword("some-password", encoded)).toBe(true);
	});
});
