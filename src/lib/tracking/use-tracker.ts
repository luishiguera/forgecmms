import { del, get, set } from "idb-keyval";
import { useSyncExternalStore } from "react";
import { updateMyLocation } from "@/server/domains/tracking/fn";
import { type Fix, isMove, isSendable, SEND_INTERVAL_MS } from "./geo";

type TrackerState = {
	isTracking: boolean;
	isDenied: boolean;
	last?: Fix;
};

type StoredTracker = {
	organizationId: string;
	last?: Fix;
};

const STORAGE_KEY = "location-tracker";
const IDLE: TrackerState = { isTracking: false, isDenied: false };

let state: TrackerState = IDLE;
let hydrated = false;
let watchId: number | undefined;
let sender: ReturnType<typeof setInterval> | undefined;
let organizationId: string | undefined;
let lastSentTimestamp: string | undefined;

const listeners = new Set<() => void>();

const emit = () => {
	for (const listener of listeners) listener();
};

const apply = (next: Partial<TrackerState>) => {
	state = { ...state, ...next };
	emit();
};

const persist = () => {
	if (!organizationId) return;
	const stored: StoredTracker = { organizationId, last: state.last };
	set(STORAGE_KEY, stored).catch(() => {});
};

const send = async () => {
	if (typeof document !== "undefined" && document.hidden) return;
	if (!organizationId) return;
	const fix = state.last;
	if (!isSendable(fix, lastSentTimestamp)) return;

	try {
		await updateMyLocation({
			data: {
				organization_id: organizationId,
				latitude: fix.latitude,
				longitude: fix.longitude,
			},
		});
		lastSentTimestamp = fix.timestamp;
	} catch {
		return;
	}
};

const onPosition = (position: GeolocationPosition) => {
	const next: Fix = {
		latitude: position.coords.latitude,
		longitude: position.coords.longitude,
		timestamp: new Date().toISOString(),
	};
	if (!isMove(state.last, next)) return;
	apply({ last: next, isDenied: false });
	persist();
};

const onPositionError = (error: GeolocationPositionError) => {
	if (error.code === error.PERMISSION_DENIED) {
		stopTracking();
		apply({ isDenied: true });
		return;
	}
	apply({ isDenied: false });
};

const onVisibilityChange = () => {
	if (!document.hidden) void send();
};

export const startTracking = (orgId: string) => {
	if (typeof navigator === "undefined" || !navigator.geolocation) {
		apply({ isDenied: true });
		return;
	}
	organizationId = orgId;
	if (state.isTracking) return;

	watchId = navigator.geolocation.watchPosition(onPosition, onPositionError, {
		enableHighAccuracy: true,
		maximumAge: 30_000,
		timeout: 30_000,
	});
	sender = setInterval(() => void send(), SEND_INTERVAL_MS);
	document.addEventListener("visibilitychange", onVisibilityChange);

	apply({ isTracking: true, isDenied: false });
	persist();
};

export const stopTracking = () => {
	if (watchId !== undefined) {
		navigator.geolocation.clearWatch(watchId);
		watchId = undefined;
	}
	if (sender) {
		clearInterval(sender);
		sender = undefined;
	}
	if (typeof document !== "undefined") {
		document.removeEventListener("visibilitychange", onVisibilityChange);
	}
	lastSentTimestamp = undefined;
	del(STORAGE_KEY).catch(() => {});
	state = IDLE;
	emit();
};

const hydrate = () => {
	if (hydrated) return;
	hydrated = true;
	get<StoredTracker>(STORAGE_KEY)
		.then((stored) => {
			if (!stored) return;
			apply({ last: stored.last });
			startTracking(stored.organizationId);
		})
		.catch(() => {});
};

const subscribe = (listener: () => void) => {
	hydrate();
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

const getSnapshot = () => state;
const getServerSnapshot = () => IDLE;

export const useLocationTracker = () =>
	useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
