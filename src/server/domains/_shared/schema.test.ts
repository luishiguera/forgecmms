import { describe, expect, it } from "vitest";
import { assetSearchParamsSchema } from "../assets/schema";
import { paginationSchema } from "./schema";

describe("pagination schema", () => {
	it("defaults an empty input the way the Go handler did", () => {
		expect(paginationSchema.parse({})).toEqual({ page: 1, size: 20 });
	});

	it("coerces query string values", () => {
		expect(paginationSchema.parse({ page: "3", size: "50" })).toEqual({
			page: 3,
			size: 50,
		});
	});

	it("falls back instead of throwing on junk, as strconv.Atoi did", () => {
		expect(paginationSchema.parse({ page: "abc", size: "abc" })).toEqual({
			page: 1,
			size: 20,
		});
		expect(paginationSchema.parse({ page: 0, size: 0 })).toEqual({
			page: 1,
			size: 20,
		});
		expect(paginationSchema.parse({ page: -5, size: 5000 })).toEqual({
			page: 1,
			size: 20,
		});
	});

	it("accepts a call site that passes no pagination at all", () => {
		const params = assetSearchParamsSchema.parse({ q: "pump" });
		expect(params).toEqual({ q: "pump", page: 1, size: 20 });
	});

	it("coerces the filter ids that arrive from the URL as strings", () => {
		const params = assetSearchParamsSchema.parse({
			tag_id: "7",
			location_id: "9",
		});
		expect(params.tag_id).toBe(7);
		expect(params.location_id).toBe(9);
	});

	it("rejects an unknown status instead of silently ignoring it", () => {
		expect(assetSearchParamsSchema.safeParse({ status: "nope" }).success).toBe(
			false,
		);
	});
});
