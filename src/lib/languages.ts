export const LANGUAGES = [
	{ value: "en-US", label: "English (US)" },
	{ value: "pt-BR", label: "Português (BR)" },
	{ value: "es", label: "Español" },
] as const;

export type Language = (typeof LANGUAGES)[number]["value"];

export const languageLabel = (value: string) =>
	LANGUAGES.find((language) => language.value === value)?.label ?? value;
