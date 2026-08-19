import { sql } from "drizzle-orm";
import { fromDrizzle } from "pg-boss";
import type { IDB } from "../db/client";
import { senderBoss, WORK_ORDER_REPORT_QUEUE } from "./boss";

export type WorkOrderReportPayload = {
	organization_id: number;
	work_order_id: number;
};

export const enqueueWorkOrderReport = async (
	organizationId: number,
	workOrderId: number,
	dbc: IDB,
) => {
	const boss = await senderBoss();

	await boss.send(
		WORK_ORDER_REPORT_QUEUE,
		{ organization_id: organizationId, work_order_id: workOrderId },
		{ db: fromDrizzle(dbc, sql) },
	);
};
