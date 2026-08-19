import { and, count, eq, gte, isNotNull, isNull, lt, sql } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { db, type IDB } from "../../db/client";
import { assets, parts, workOrders } from "../../db/schema";

type Countable = {
	table: PgTable;
	organizationId: PgColumn;
	deletedAt: PgColumn;
};

const countables = {
	work_orders: {
		table: workOrders,
		organizationId: workOrders.organizationId,
		deletedAt: workOrders.deletedAt,
	},
	assets: {
		table: assets,
		organizationId: assets.organizationId,
		deletedAt: assets.deletedAt,
	},
	parts: {
		table: parts,
		organizationId: parts.organizationId,
		deletedAt: parts.deletedAt,
	},
} satisfies Record<string, Countable>;

export type CountableName = keyof typeof countables;

export const groupCount = async <C extends PgColumn>(
	name: CountableName,
	column: C,
	organizationId: number,
	dbc: IDB = db,
) => {
	const target = countables[name];

	const rows = await dbc
		.select({ key: sql<C["_"]["data"]>`${column}::text`, count: count() })
		.from(target.table)
		.where(
			and(eq(target.organizationId, organizationId), isNull(target.deletedAt)),
		)
		.groupBy(column);

	return rows;
};

export const countRows = async (
	name: CountableName,
	organizationId: number,
	dbc: IDB = db,
) => {
	const target = countables[name];
	return dbc.$count(
		target.table,
		and(eq(target.organizationId, organizationId), isNull(target.deletedAt)),
	);
};

export const countLowStockParts = async (
	organizationId: number,
	dbc: IDB = db,
) =>
	dbc.$count(
		parts,
		and(
			eq(parts.organizationId, organizationId),
			isNull(parts.deletedAt),
			lt(parts.quantity, parts.minQuantity),
		),
	);

export const monthlyCounts = async (
	organizationId: number,
	timezone: string,
	column: "created_at" | "closed_at",
	since: Date,
	dbc: IDB = db,
) => {
	const dateColumn =
		column === "created_at" ? workOrders.createdAt : workOrders.closedAt;

	const rows = await dbc
		.select({
			key: sql<string>`to_char(date_trunc('month', ${dateColumn} AT TIME ZONE ${timezone}), 'YYYY-MM')`,
			count: count(),
		})
		.from(workOrders)
		.where(
			and(
				eq(workOrders.organizationId, organizationId),
				isNull(workOrders.deletedAt),
				gte(dateColumn, since),
				column === "closed_at" ? isNotNull(workOrders.closedAt) : undefined,
			),
		)
		.groupBy(sql`1`);

	return new Map(rows.map((row) => [row.key, row.count]));
};
