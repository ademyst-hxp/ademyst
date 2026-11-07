import { useDb } from "#server/db";
import { dataExports } from "~~/server/db/schema/exports";
import { and, eq } from "drizzle-orm";

import { convertDataExport } from "~~/server/utils/converters/exports";
import { isUuid } from "~~/server/utils/helpers/exports";

import type { H3Event } from "h3";

// Métadonnées d'un export
export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const id = event.context.params?.id;

	if (!isUuid(id)) {
		throw createError({
			statusCode: 404,
			statusMessage: "Export not found",
		});
	}

	const identity = await requireAuth(event);

	// Filtré sur le compte : l'export d'un autre utilisateur est indiscernable d'un export inexistant
	const [row] = await db
		.select()
		.from(dataExports)
		.where(
			and(
				eq(dataExports.id, id),
				eq(dataExports.accountId, identity.accountId),
			),
		)
		.limit(1);

	if (!row) {
		throw createError({
			statusCode: 404,
			statusMessage: "Export not found",
		});
	}

	if (row.expiresAt <= new Date()) {
		throw createError({
			statusCode: 410,
			statusMessage: "Export expired",
		});
	}

	return {
		status: "ok",
		data: convertDataExport(row),
	};
});
