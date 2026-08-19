import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function mergeById<
	T extends { id: number },
	U extends { id: number } = T,
>(existing: T[], more: U[]): (T | U)[] {
	const ids = new Set(existing.map((e) => e.id));
	return [...existing, ...more.filter((m) => !ids.has(m.id))];
}
