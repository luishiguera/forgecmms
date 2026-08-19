import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const migrationsFolder = fileURLToPath(
	new URL("./migrations", import.meta.url),
);

export const runMigrations = async () => {
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });
	try {
		await migrate(drizzle(pool), { migrationsFolder });
	} finally {
		await pool.end();
	}
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await runMigrations();
}
