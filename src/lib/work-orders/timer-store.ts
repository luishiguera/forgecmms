export type TimerEntry = {
	startedAtMs: number;
	accumulatedMs: number;
	isRunning: boolean;
};

export type TimerState = {
	entries: Record<number, TimerEntry>;
	activeId?: number;
	nowMs: number;
};

export const EMPTY_STATE: TimerState = { entries: {}, nowMs: 0 };

export const elapsedMs = (
	entry: TimerEntry | undefined,
	nowMs: number,
): number => {
	if (!entry) return 0;
	if (!entry.isRunning) return entry.accumulatedMs;
	return entry.accumulatedMs + Math.max(0, nowMs - entry.startedAtMs);
};

export const elapsedSince = (
	startedAt: string | null | undefined,
	nowMs: number,
): number => {
	if (!startedAt) return 0;
	const startedAtMs = Date.parse(startedAt);
	if (Number.isNaN(startedAtMs)) return 0;
	return Math.max(0, nowMs - startedAtMs);
};

export const formatElapsed = (milliseconds: number): string => {
	const total = Math.floor(milliseconds / 1000);
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const seconds = total % 60;
	return [hours, minutes, seconds]
		.map((part) => String(part).padStart(2, "0"))
		.join(":");
};

const folded = (entry: TimerEntry, nowMs: number): TimerEntry => ({
	startedAtMs: nowMs,
	accumulatedMs: elapsedMs(entry, nowMs),
	isRunning: false,
});

export const restore = (
	entries: Record<number, TimerEntry>,
	nowMs: number,
): TimerState => {
	const restored: Record<number, TimerEntry> = {};
	let activeId: number | undefined;

	for (const [key, entry] of Object.entries(entries)) {
		const id = Number(key);
		if (!Number.isInteger(id)) continue;
		if (entry.isRunning) {
			activeId = id;
			restored[id] = {
				startedAtMs: nowMs,
				accumulatedMs: elapsedMs(entry, nowMs),
				isRunning: true,
			};
			continue;
		}
		restored[id] = entry;
	}

	return { entries: restored, activeId, nowMs };
};

export const start = (
	state: TimerState,
	id: number,
	nowMs: number,
): TimerState => {
	const entries = { ...state.entries };
	const active = state.activeId;

	if (active !== undefined && active !== id && entries[active]?.isRunning) {
		entries[active] = folded(entries[active], nowMs);
	}

	const existing = entries[id];
	if (existing?.isRunning) return state;

	entries[id] = {
		startedAtMs: nowMs,
		accumulatedMs: existing?.accumulatedMs ?? 0,
		isRunning: true,
	};

	return { entries, activeId: id, nowMs };
};

export const adopt = (
	state: TimerState,
	id: number,
	startedAtMs: number,
	nowMs: number,
): TimerState => {
	if (state.entries[id]) return state;
	const started = start(state, id, nowMs);

	return {
		...started,
		entries: {
			...started.entries,
			[id]: { startedAtMs, accumulatedMs: 0, isRunning: true },
		},
	};
};

export const pause = (
	state: TimerState,
	id: number,
	nowMs: number,
): TimerState => {
	const entry = state.entries[id];
	if (!entry?.isRunning) return state;

	return {
		entries: { ...state.entries, [id]: folded(entry, nowMs) },
		activeId: state.activeId === id ? undefined : state.activeId,
		nowMs,
	};
};

export const reset = (
	state: TimerState,
	id: number,
	nowMs: number,
): TimerState => {
	const { [id]: _removed, ...entries } = state.entries;
	return {
		entries,
		activeId: state.activeId === id ? undefined : state.activeId,
		nowMs,
	};
};

export const tick = (state: TimerState, nowMs: number): TimerState =>
	state.nowMs === nowMs ? state : { ...state, nowMs };
