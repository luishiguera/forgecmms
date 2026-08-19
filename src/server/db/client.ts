import "dotenv/config";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	max: 25,
	idleTimeoutMillis: 30_000,
	maxLifetimeSeconds: 300,
});

export const db = drizzle({ client: pool, schema, casing: "snake_case" });

export type DB = NodePgDatabase<typeof schema>;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export type IDB = DB | Tx;

export const toISO = <T extends Date | null | undefined>(
	value: T,
): T extends Date ? string : null =>
	(value ? value.toISOString() : null) as T extends Date ? string : null;
