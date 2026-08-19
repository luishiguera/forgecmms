import { logError } from "../logger";
import { createBoss, WORK_ORDER_REPORT_QUEUE } from "./boss";
import {
	handleWorkOrderReport,
	type WorkOrderReportPayload,
} from "./report/handler";

const CONCURRENCY = 2;

export const startWorker = async () => {
	const boss = await createBoss();

	await boss.work<WorkOrderReportPayload>(
		WORK_ORDER_REPORT_QUEUE,
		{ batchSize: CONCURRENCY, pollingIntervalSeconds: 1 },
		async (jobs) => {
			for (const job of jobs) {
				try {
					await handleWorkOrderReport(job.data);
				} catch (error) {
					logError(`${WORK_ORDER_REPORT_QUEUE} failed`, error);
					throw error;
				}
			}
		},
	);

	console.log(`worker listening on ${WORK_ORDER_REPORT_QUEUE}`);

	const stop = async () => {
		await boss.stop({ graceful: true });
		process.exit(0);
	};

	process.on("SIGTERM", stop);
	process.on("SIGINT", stop);

	return boss;
};
