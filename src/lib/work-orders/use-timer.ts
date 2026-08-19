import { get, set } from "idb-keyval";
import { useSyncExternalStore } from "react";
import {
	adopt,
	EMPTY_STATE,
	elapsedMs,
	elapsedSince,
	pause,
	reset,
	restore,
	start,
	type TimerEntry,
	type TimerState,
	tick,
} from "./timer-store";

const STORAGE_KEY = "work-order-timers";
const TICK_MS = 1000;

let state: TimerState = EMPTY_STATE;
let hydrated = false;
let ticker: ReturnType<typeof setInterval> | undefined;

const listeners = new Set<() => void>();

const emit = () => {
	for (const listener of listeners) listener();
};

const persist = () => {
	set(STORAGE_KEY, state.entries).catch(() => {});
};

const syncTicker = () => {
	if (listeners.size > 0 && !ticker) {
		ticker = setInterval(() => {
			state = tick(state, Date.now());
			emit();
		}, TICK_MS);
		return;
	}
	if (listeners.size === 0 && ticker) {
		clearInterval(ticker);
		ticker = undefined;
	}
};

const apply = (next: TimerState) => {
	if (next === state) return;
	state = next;
	persist();
	syncTicker();
	emit();
};

const hydrate = () => {
	if (hydrated) return;
	hydrated = true;
	get<Record<number, TimerEntry>>(STORAGE_KEY)
		.then((entries) => {
			state = restore({ ...entries, ...state.entries }, Date.now());
			emit();
		})
		.catch(() => {});
};

const subscribe = (listener: () => void) => {
	listeners.add(listener);
	hydrate();
	syncTicker();
	return () => {
		listeners.delete(listener);
		syncTicker();
	};
};

const getSnapshot = () => state;
const getServerSnapshot = () => EMPTY_STATE;

export const startTimer = (id: number) => apply(start(state, id, Date.now()));
export const adoptTimer = (id: number, startedAt: string) => {
	const startedAtMs = Date.parse(startedAt);
	if (Number.isNaN(startedAtMs)) return;
	apply(adopt(state, id, startedAtMs, Date.now()));
};
export const pauseTimer = (id: number) => apply(pause(state, id, Date.now()));
export const resetTimer = (id: number) => apply(reset(state, id, Date.now()));

export const useWorkOrderTimer = (
	workOrderId: number,
	startedAt?: string | null,
) => {
	const current = useSyncExternalStore(
		subscribe,
		getSnapshot,
		getServerSnapshot,
	);
	const entry = current.entries[workOrderId];

	return {
		elapsed: entry
			? elapsedMs(entry, current.nowMs)
			: elapsedSince(startedAt, current.nowMs),
		isRunning: entry?.isRunning ?? false,
		hasRun: entry !== undefined,
		activeId: current.activeId,
	};
};
