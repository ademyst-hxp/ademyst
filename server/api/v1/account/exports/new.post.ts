import { useDb } from "#server/db";
import { dataExports } from "~~/server/db/schema/exports";
import { and, eq, lt, sql } from "drizzle-orm";

import { convertDataExport } from "~~/server/utils/converters/exports";
import { useDrive } from "~~/server/utils/drive";
import {
	buildAccountExport,
	EXPORT_BUCKET,
	EXPORT_STALE_MS,
	EXPORT_TTL_MS,
	exportKey,
	getNextExportAt,
} from "~~/server/utils/helpers/exports";

import {
	createError,
	defineEventHandler,
	setResponseHeader,
	setResponseStatus,
} from "h3";
import type { H3Event } from "h3";

// Demande un nouvel export de données (1 par période glissante de 7 jours)
export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const now = new Date();

	// Verrou + vérification + réservation dans une même transaction pour que deux
	// requêtes simultanées ne passent pas toutes les deux la limite hebdomadaire.
	const reservation = await db.transaction(async (tx) => {
		await tx.execute(
			sql`select pg_advisory_xact_lock(hashtext(${identity.accountId}::text))`,
		);

		// Un export bloqué en "processing" (worker interrompu) ne doit pas bloquer une semaine
		await tx
			.update(dataExports)
			.set({ status: "failed", completedAt: now })
			.where(
				and(
					eq(dataExports.accountId, identity.accountId),
					eq(dataExports.status, "processing"),
					lt(
						dataExports.createdAt,
						new Date(now.getTime() - EXPORT_STALE_MS),
					),
				),
			);

		const nextAvailableAt = await getNextExportAt(
			tx,
			identity.accountId,
			now,
		);

		if (nextAvailableAt) {
			return { nextAvailableAt };
		}

		const [row] = await tx
			.insert(dataExports)
			.values({
				accountId: identity.accountId,
				createdAt: now,
				expiresAt: new Date(now.getTime() + EXPORT_TTL_MS),
			})
			.returning();

		return { row };
	});

	if (reservation.nextAvailableAt) {
		setResponseHeader(
			event,
			"Retry-After",
			Math.max(
				1,
				Math.ceil(
					(reservation.nextAvailableAt.getTime() - now.getTime()) /
						1000,
				),
			),
		);

		throw createError({
			statusCode: 429,
			statusMessage: "Export already requested this week",
			data: { nextAvailableAt: reservation.nextAvailableAt },
		});
	}

	const pending = reservation.row;

	if (!pending) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to create export",
		});
	}

	const storage = useDrive(event, EXPORT_BUCKET);
	const key = exportKey(identity.accountId, pending.id);

	try {
		const data = await buildAccountExport(
			db,
			identity.accountId,
			identity.profileId,
		);

		const bytes = new TextEncoder().encode(JSON.stringify(data, null, 2));

		await storage.put(key, bytes, {
			contentType: "application/json; charset=utf-8",
		});

		const [ready] = await db
			.update(dataExports)
			.set({
				status: "ready",
				key,
				size: bytes.byteLength,
				completedAt: new Date(),
			})
			.where(eq(dataExports.id, pending.id))
			.returning();

		if (!ready) {
			throw new Error("Export row disappeared");
		}

		setResponseStatus(event, 201);

		return {
			status: "ok",
			data: convertDataExport(ready),
		};
	} catch (error) {
		console.error("Error occurred while generating data export:", error);

		// Un export échoué ne compte pas dans la limite hebdomadaire
		await db
			.update(dataExports)
			.set({ status: "failed", completedAt: new Date() })
			.where(eq(dataExports.id, pending.id))
			.catch(() => {});

		await storage.delete(key).catch(() => {});

		throw createError({
			statusCode: 500,
			statusMessage: "Failed to generate export",
		});
	}
});
