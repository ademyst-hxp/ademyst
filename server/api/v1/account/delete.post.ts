import { createError, readBody } from "h3";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "#server/db";
import { accountDeletionTokens, accounts } from "#server/db/schema/accounts";

function normalizeToken(value: unknown): string | null {
	if (typeof value !== "string") return null;

	const token = value.trim();

	return token.length ? token : null;
}

export default defineEventHandler(async (event) => {
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

		await tx.delete(accounts).where(eq(accounts.id, tokenRow.accountId));
	});

	return { ok: true };
});
