import { createError, readBody } from "h3";
import { and, eq, isNull } from "drizzle-orm";

import { createDb } from "#server/db";
import {
	accountDeletionTokens,
	accountModificationHistory,
	accounts,
} from "#server/db/schema/accounts";

function normalizeToken(value: unknown): string | null {
	if (typeof value !== "string") return null;

	const token = value.trim();

	return token.length ? token : null;
}

export default defineEventHandler(async (event) => {
	const { db, client } = createDb();

	try {
		const body = await readBody(event);

		const token = normalizeToken(body?.token);

		if (!token) {
			throw createError({
				statusCode: 400,
				statusMessage: "Invalid payload",
			});
		}

		await db.transaction(async (tx) => {
			const [tokenRow] = await tx
				.select({
					id: accountDeletionTokens.id,
					accountId: accountDeletionTokens.accountId,
				})
				.from(accountDeletionTokens)
				.where(
					and(
						eq(accountDeletionTokens.token, token),
						isNull(accountDeletionTokens.usedAt),
						eq(accountDeletionTokens.revoked, false),
					),
				)
				.limit(1);

			if (!tokenRow) {
				throw createError({
					statusCode: 400,
					statusMessage: "Invalid or expired token",
				});
			}

			await tx
				.update(accountDeletionTokens)
				.set({ usedAt: new Date(), revoked: true })
				.where(eq(accountDeletionTokens.id, tokenRow.id));

			await tx
				.delete(accounts)
				.where(eq(accounts.id, tokenRow.accountId));

			try {
				const ipAddress = getRequestIP(event) ?? null;
				const userAgent = getHeader(event, "user-agent") ?? null;

				const safeUserAgent = userAgent ?? "unknown";
				const safeIp = ipAddress ?? "unknown";

				await tx.insert(accountModificationHistory).values({
					accountId: tokenRow.accountId,
					action: "account_deletion",
					ipAddress: safeIp,
					userAgent: safeUserAgent,
				});
			} catch {
				// Account deletion already succeeded; notification failures should not fail the request.
			}
		});

		return { ok: true };
	} finally {
		await client.end();
	}
});
