const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * KILOBYTE;
const GIGABYTE = MEGABYTE * KILOBYTE;

export const MAX_UPLOAD_MB = 20;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * MEGABYTE;

const trim = (value: number, unit: string) =>
	`${Number(value.toFixed(1))} ${unit}`;

export function formatFileSize(bytes: number | null | undefined): string {
	if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return "";
	if (bytes < KILOBYTE) return `${Math.round(bytes)} B`;
	if (bytes < MEGABYTE) return trim(bytes / KILOBYTE, "KB");
	if (bytes < GIGABYTE) return trim(bytes / MEGABYTE, "MB");
	return trim(bytes / GIGABYTE, "GB");
}

export function formatMegabytes(megabytes: number): string {
	return formatFileSize(megabytes * MEGABYTE) || "0 MB";
}
