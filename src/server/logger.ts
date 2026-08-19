const asError = (error: unknown) =>
	error instanceof Error ? error : new Error(String(error));

export const logError = (message: string, error: unknown) => {
	console.error(message, asError(error));
};
