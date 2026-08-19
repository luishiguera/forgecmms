const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

const codeOf = (error: unknown): string | undefined => {
	let current = error;
	for (let depth = 0; current && depth < 5; depth += 1) {
		if (typeof current !== "object") return undefined;
		const code = (current as { code?: unknown }).code;
		if (typeof code === "string" && /^\d{5}$/.test(code)) return code;
		current = (current as { cause?: unknown }).cause;
	}
	return undefined;
};

export const isUniqueViolation = (error: unknown) =>
	codeOf(error) === UNIQUE_VIOLATION;

export const isForeignKeyViolation = (error: unknown) =>
	codeOf(error) === FOREIGN_KEY_VIOLATION;
