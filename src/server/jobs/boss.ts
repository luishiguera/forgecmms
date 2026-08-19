import type { ConstructorOptions } from "pg-boss";
import { PgBoss } from "pg-boss";
import { logError } from "../logger";

export const WORK_ORDER_REPORT_QUEUE = "workorder.report.generate";

const QUEUE_OPTIONS = {
	retryLimit: 4,
	retryDelay: 2,
	retryBackoff: true,
	retryDelayMax: 300,
	expireInSeconds: 120,
};

export const createBoss = async (options: ConstructorOptions = {}) => {
	const boss = new PgBoss({
		connectionString: process.env.DATABASE_URL,
		schedule: false,
		...options,
	});

	boss.on("error", (error: Error) => {
		logError("pg-boss error", error);
	});

	await boss.start();
	await boss.createQueue(WORK_ORDER_REPORT_QUEUE, QUEUE_OPTIONS);

	return boss;
};

let sender: Promise<PgBoss> | undefined;

export const senderBoss = () => {
	sender ??= createBoss({ supervise: false });
	return sender;
};

export const stopSenderBoss = async () => {
	if (!sender) return;
	const boss = await sender;
	sender = undefined;
	await boss.stop({ graceful: true });
};
