import {
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { accounts } from "./accounts";

export const dataExportStatusEnum = pgEnum("data_export_status", [
	"processing",
	"ready",
	"failed",
]);

export type DataExportStatus = (typeof dataExportStatusEnum.enumValues)[number];

export const dataExports = pgTable(
	"data_exports",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		accountId: uuid("account_id")
			.notNull()
			.references(() => accounts.id, { onDelete: "cascade" }),

		status: dataExportStatusEnum("status").notNull().default("processing"),

		// Clé de l'objet dans le bucket "data-exports" (renseignée quand l'export est prêt)
		key: text("key"),
		size: integer("size"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
		completedAt: timestamp("completed_at"),
		expiresAt: timestamp("expires_at").notNull(),
	},
	(table) => [
		index("data_exports_account_id_created_at_idx").on(
			table.accountId,
			table.createdAt,
		),
	],
).enableRLS();

export type DataExport = typeof dataExports.$inferSelect;
