export const APP_ERROR_CODES = [
	"unauthorized",
	"forbidden",
	"not_found",
	"conflict",
	"invalid_input",
	"invalid_credentials",
	"email_taken",
	"token_expired",
	"internal",
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export class AppError extends Error {
	readonly code: AppErrorCode;
	readonly detail?: string;

	constructor(code: AppErrorCode, detail?: string) {
		super(code);
		this.name = "AppError";
		this.code = code;
		this.detail = detail;
	}
}

export const unauthorized = () => new AppError("unauthorized");
export const forbidden = () => new AppError("forbidden");
export const notFound = () => new AppError("not_found");
export const conflict = (detail?: string) => new AppError("conflict", detail);

const isAppErrorCode = (value: string): value is AppErrorCode =>
	APP_ERROR_CODES.some((code) => code === value);

export const errorCodeOf = (error: unknown): AppErrorCode | undefined => {
	if (!(error instanceof Error)) return undefined;
	const candidate =
		"code" in error && typeof error.code === "string"
			? error.code
			: error.message;
	return isAppErrorCode(candidate) ? candidate : undefined;
};

export const isAppError = (
	error: unknown,
	code?: AppErrorCode,
): error is AppError => {
	const found = errorCodeOf(error);
	return found !== undefined && (code === undefined || found === code);
};
