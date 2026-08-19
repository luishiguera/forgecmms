export type Fix = {
	latitude: number;
	longitude: number;
	timestamp: string;
};

export const MIN_DISTANCE_METERS = 20;
export const SEND_INTERVAL_MS = 2 * 60 * 1000;

const EARTH_RADIUS_M = 6_371_000;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const distanceMeters = (from: Fix, to: Fix): number => {
	const latitudeDelta = toRadians(to.latitude - from.latitude);
	const longitudeDelta = toRadians(to.longitude - from.longitude);
	const fromLatitude = toRadians(from.latitude);
	const toLatitude = toRadians(to.latitude);

	const a =
		Math.sin(latitudeDelta / 2) ** 2 +
		Math.sin(longitudeDelta / 2) ** 2 *
			Math.cos(fromLatitude) *
			Math.cos(toLatitude);

	return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
};

export const isMove = (
	last: Fix | undefined,
	next: Fix,
	minMeters = MIN_DISTANCE_METERS,
): boolean => !last || distanceMeters(last, next) >= minMeters;

export const isSendable = (
	fix: Fix | undefined,
	lastSentTimestamp: string | undefined,
): fix is Fix => !!fix && fix.timestamp !== lastSentTimestamp;
