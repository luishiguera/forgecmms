import "dotenv/config";
import { runMigrations } from "../src/server/db/migrate.ts";

await runMigrations();
console.log("migrations up to date");
