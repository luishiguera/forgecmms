import { type AppErrorCode, isAppError } from "@/server/errors";

export const isNotFound = (error: unknown) => isAppError(error, "not_found");

export async function mapError<T>(
	code: AppErrorCode,
	message: string,
	run: () => Promise<T>,
): Promise<T> {
	try {
		return await run();
	} catch (error) {
		if (isAppError(error, code)) throw new Error(message);
		throw error;
	}
}
