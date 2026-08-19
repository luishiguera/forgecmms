import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

const REFILL_PER_SECOND = 0.2;
const BURST = 10;
const EXPIRES_MS = 3 * 60 * 1000;

type Bucket = { tokens: number; updatedAt: number };

const buckets = new Map<string, Bucket>();

const sweep = (now: number) => {
	for (const [key, bucket] of buckets) {
		if (now - bucket.updatedAt > EXPIRES_MS) buckets.delete(key);
	}
};

export const clientKey = () => {
	const forwarded = getRequestHeader("x-forwarded-for");
	if (forwarded) return forwarded.split(",")[0].trim();
	return getRequestIP() ?? "unknown";
};

export const consume = (key: string, now = Date.now()) => {
	sweep(now);

	const bucket = buckets.get(key) ?? { tokens: BURST, updatedAt: now };
	const refilled = Math.min(
		BURST,
		bucket.tokens + ((now - bucket.updatedAt) / 1000) * REFILL_PER_SECOND,
	);

	if (refilled < 1) {
		buckets.set(key, { tokens: refilled, updatedAt: now });
		return false;
	}

	buckets.set(key, { tokens: refilled - 1, updatedAt: now });
	return true;
};

export const resetBuckets = () => buckets.clear();
