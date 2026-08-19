import { describe, expect, it } from "vitest";
import type { FormFieldConfig } from "@/components/procedure-builder/utils/types";
import { collectErrors, firstError, isEmpty, isVisible } from "./validation";

const field = (overrides: Partial<FormFieldConfig> = {}): FormFieldConfig => ({
	id: "f1",
	type: "short_text",
	label: "Field",
	order: 0,
	validation: [],
	...overrides,
});

describe("isEmpty", () => {
	it("treats blanks, empty lists and empty objects as empty", () => {
		expect(isEmpty(undefined)).toBe(true);
		expect(isEmpty(null)).toBe(true);
		expect(isEmpty("")).toBe(true);
		expect(isEmpty([])).toBe(true);
		expect(isEmpty({})).toBe(true);
	});

	it("keeps false and zero as answers", () => {
		expect(isEmpty(false)).toBe(false);
		expect(isEmpty(0)).toBe(false);
	});
});

describe("firstError", () => {
	it("reports a missing required answer", () => {
		const required = field({
			validation: [{ type: "required", message: "Required" }],
		});
		expect(firstError(required, undefined)).toBe("Required");
		expect(firstError(required, "answered")).toBeUndefined();
	});

	it("skips the other rules when the answer is empty", () => {
		const optional = field({
			validation: [{ type: "min_length", value: 5, message: "Too short" }],
		});
		expect(firstError(optional, "")).toBeUndefined();
		expect(firstError(optional, "abc")).toBe("Too short");
	});

	it("checks numbers, text length, pattern, email, phone and url", () => {
		expect(
			firstError(
				field({ validation: [{ type: "min", value: 3, message: "Low" }] }),
				2,
			),
		).toBe("Low");
		expect(
			firstError(
				field({ validation: [{ type: "max", value: 3, message: "High" }] }),
				4,
			),
		).toBe("High");
		expect(
			firstError(
				field({
					validation: [{ type: "max_length", value: 2, message: "Long" }],
				}),
				"abc",
			),
		).toBe("Long");
		expect(
			firstError(
				field({
					validation: [{ type: "pattern", value: "^A", message: "Pattern" }],
				}),
				"B",
			),
		).toBe("Pattern");
		expect(
			firstError(
				field({ validation: [{ type: "email", message: "Email" }] }),
				"nope",
			),
		).toBe("Email");
		expect(
			firstError(
				field({ validation: [{ type: "phone", message: "Phone" }] }),
				"abc",
			),
		).toBe("Phone");
		expect(
			firstError(
				field({ validation: [{ type: "url", message: "Url" }] }),
				"not a url",
			),
		).toBe("Url");
		expect(
			firstError(
				field({ validation: [{ type: "url", message: "Url" }] }),
				"https://forgecmms.com",
			),
		).toBeUndefined();
	});

	it("returns the first failing rule only", () => {
		const both = field({
			validation: [
				{ type: "min_length", value: 5, message: "First" },
				{ type: "email", message: "Second" },
			],
		});
		expect(firstError(both, "a@b")).toBe("First");
	});
});

describe("isVisible", () => {
	const dependent = (
		operator: "equals" | "notEquals" | "contains" | "isEmpty" | "isNotEmpty",
		action: "show" | "hide",
		value?: string,
	) =>
		field({
			id: "f2",
			conditional_logic: { field_id: "f1", operator, value, action },
		});

	it("shows a field with no rule", () => {
		expect(isVisible(field(), {})).toBe(true);
	});

	it("applies equals and notEquals", () => {
		expect(isVisible(dependent("equals", "show", "yes"), { f1: "yes" })).toBe(
			true,
		);
		expect(isVisible(dependent("equals", "show", "yes"), { f1: "no" })).toBe(
			false,
		);
		expect(isVisible(dependent("notEquals", "show", "yes"), { f1: "no" })).toBe(
			true,
		);
	});

	it("applies contains to text and to lists", () => {
		expect(isVisible(dependent("contains", "show", "b"), { f1: "abc" })).toBe(
			true,
		);
		expect(
			isVisible(dependent("contains", "show", "b"), { f1: ["a", "b"] }),
		).toBe(true);
		expect(isVisible(dependent("contains", "show", "z"), { f1: ["a"] })).toBe(
			false,
		);
	});

	it("inverts the result for a hide action", () => {
		expect(isVisible(dependent("isNotEmpty", "hide", ""), { f1: "x" })).toBe(
			false,
		);
		expect(isVisible(dependent("isEmpty", "hide", ""), { f1: "x" })).toBe(true);
	});
});

describe("collectErrors", () => {
	it("ignores hidden fields", () => {
		const trigger = field({ id: "f1" });
		const hidden = field({
			id: "f2",
			validation: [{ type: "required", message: "Required" }],
			conditional_logic: {
				field_id: "f1",
				operator: "equals",
				value: "yes",
				action: "show",
			},
		});

		expect(collectErrors([trigger, hidden], { f1: "no" })).toEqual({});
		expect(collectErrors([trigger, hidden], { f1: "yes" })).toEqual({
			f2: "Required",
		});
	});
});
