import type { DataExport as DbDataExport } from "~~/server/db/schema/exports";

import type { DataExport } from "~~/shared/models/exports";

export function convertDataExport(row: DbDataExport): DataExport {
	return {
		id: row.id,
		status: row.status,
		size: row.size ?? null,
		downloadUrl:
			row.status === "ready"
				? `/api/v1/account/exports/${row.id}/download`
				: null,
		createdAt: row.createdAt,
		completedAt: row.completedAt ?? null,
		expiresAt: row.expiresAt,
	};
}
