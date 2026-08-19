import type {
	ConditionalRule,
	FormFieldConfig,
} from "@/components/procedure-builder/utils/types";
import type { ProcedureResponses } from "@/server/domains/workorders/schema";

export type Responses = ProcedureResponses;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[+]?[\d\s().-]{6,}$/;

export const isEmpty = (value: unknown) =>
	value === undefined ||
	value === null ||
	value === "" ||
	(Array.isArray(value) && value.length === 0) ||
	(typeof value === "object" && Object.keys(value as object).length === 0);

const asText = (value: unknown) => (typeof value === "string" ? value : "");

const asNumber = (value: unknown) => Number(value);

const failsRule = (
	rule: FormFieldConfig["validation"][number],
	value: unknown,
): boolean => {
	if (rule.type === "required") return isEmpty(value);
	if (isEmpty(value)) return false;

	switch (rule.type) {
		case "min":
			return asNumber(value) < Number(rule.value);
		case "max":
			return asNumber(value) > Number(rule.value);
		case "min_length":
			return asText(value).length < Number(rule.value);
		case "max_length":
			return asText(value).length > Number(rule.value);
		case "pattern":
		case "custom":
			return rule.value
				? !new RegExp(String(rule.value)).test(asText(value))
				: false;
		case "email":
			return !EMAIL.test(asText(value));
		case "phone":
			return !PHONE.test(asText(value));
		case "url":
			return !URL.canParse(asText(value));
		default:
			return false;
	}
};

export const firstError = (
	field: FormFieldConfig,
	value: unknown,
): string | undefined =>
	field.validation.find((rule) => failsRule(rule, value))?.message;

const matches = (rule: ConditionalRule, value: unknown): boolean => {
	switch (rule.operator) {
		case "equals":
			return asText(value) === (rule.value ?? "");
		case "notEquals":
			return asText(value) !== (rule.value ?? "");
		case "contains":
			return Array.isArray(value)
				? value.map(String).includes(rule.value ?? "")
				: asText(value).includes(rule.value ?? "");
		case "isEmpty":
			return isEmpty(value);
		case "isNotEmpty":
			return !isEmpty(value);
		default:
			return false;
	}
};

export const isVisible = (
	field: FormFieldConfig,
	responses: Responses,
): boolean => {
	const rule = field.conditional_logic;
	if (!rule) return true;
	const satisfied = matches(rule, responses[rule.field_id]);
	return rule.action === "show" ? satisfied : !satisfied;
};

export const collectErrors = (
	fields: FormFieldConfig[],
	responses: Responses,
): Record<string, string> => {
	const errors: Record<string, string> = {};
	for (const field of fields) {
		if (!isVisible(field, responses)) continue;
		const message = firstError(field, responses[field.id]);
		if (message) errors[field.id] = message;
	}
	return errors;
};
