import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./server/db/schema/*",
	out: "./server/db/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DIRECT_URL!,
	},
	schemaFilter: ["public"],
});
