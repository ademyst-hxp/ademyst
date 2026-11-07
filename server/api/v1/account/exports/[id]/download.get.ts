import { useDb } from "#server/db";
import { dataExports } from "~~/server/db/schema/exports";
import { and, eq } from "drizzle-orm";

import { useDrive } from "~~/server/utils/drive";
import { EXPORT_BUCKET, isUuid } from "~~/server/utils/helpers/exports";

import { createError, defineEventHandler, sendStream, setResponseHeaders } from "h3";
import type { H3Event } from "h3";

// Téléchargement du fichier d'export (JSON), en flux depuis le bucket
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

	if (row.status !== "ready" || !row.key) {
		throw createError({
			statusCode: 409,
			statusMessage: "Export is not ready",
		});
	}

	const storage = useDrive(event, EXPORT_BUCKET);

	const file = await storage.getResponse(row.key);

	// Fichier absent du bucket (supprimé par une règle de cycle de vie, par exemple)
	if (!file?.ok || !file.body) {
		throw createError({
			statusCode: 410,
			statusMessage: "Export file is no longer available",
		});
	}

	const date = row.createdAt.toISOString().split("T")[0];

	setResponseHeaders(event, {
		"Content-Type": "application/json; charset=utf-8",
		"Content-Disposition": `attachment; filename="ademyst-export-${date}.json"`,
		...(row.size ? { "Content-Length": String(row.size) } : {}),
		"Cache-Control": "private, no-store",
		"X-Content-Type-Options": "nosniff",
	});

	return sendStream(event, file.body);
});
