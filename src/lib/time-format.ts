import { useSyncExternalStore } from "react";

const STORAGE_KEY = "use_24h_format";

const listeners = new Set<() => void>();

let use24h = true;
let hydrated = false;

function hydrate() {
	if (hydrated || typeof window === "undefined") return;
	hydrated = true;
	try {
		use24h = window.localStorage.getItem(STORAGE_KEY) !== "false";
	} catch {
		use24h = true;
	}
}

export function is24hFormat(): boolean {
	hydrate();
	return use24h;
}

export function setUse24hFormat(value: boolean): void {
	hydrate();
	use24h = value;
	try {
		window.localStorage.setItem(STORAGE_KEY, String(value));
	} catch {
		return;
	} finally {
		for (const listener of listeners) listener();
	}
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function useTimeFormat(): boolean {
	return useSyncExternalStore(subscribe, is24hFormat, () => true);
}
