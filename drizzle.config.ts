import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/server/db/schema.ts",
	out: "./src/server/db/migrations",
	casing: "snake_case",
	dbCredentials: {
		url: process.env.DATABASE_URL ?? "",
	},
});
