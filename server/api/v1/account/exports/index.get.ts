import { useDb } from "#server/db";
import { dataExports } from "~~/server/db/schema/exports";
import { and, desc, eq, gt } from "drizzle-orm";

import { convertDataExport } from "~~/server/utils/converters/exports";
import { getNextExportAt } from "~~/server/utils/helpers/exports";

import type { H3Event } from "h3";

// Liste des exports encore disponibles (non expirés) du compte connecté
export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const now = new Date();

	const rows = await db
		.select()
		.from(dataExports)
		.where(
			and(
				eq(dataExports.accountId, identity.accountId),
				gt(dataExports.expiresAt, now),
			),
		)
		.orderBy(desc(dataExports.createdAt));

	return {
		status: "ok",
		data: rows.map(convertDataExport),
		// null = un nouvel export peut être demandé maintenant
		nextAvailableAt: await getNextExportAt(db, identity.accountId, now),
	};
});
