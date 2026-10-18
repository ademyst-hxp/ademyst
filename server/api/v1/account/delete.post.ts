import { createError, readBody } from "h3";
import { and, eq, isNull } from "drizzle-orm";

import { useDb } from "#server/db";
import { accountDeletionTokens, accounts } from "#server/db/schema/accounts";

function normalizeToken(value: unknown): string | null {
	if (typeof value !== "string") return null;

	const token = value.trim();

	return token.length ? token : null;
}

export default defineEventHandler(async (event) => {
	const db = useDb(event);

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
			.select()
			.from(accountDeletionTokens)
			.where(
				and(
					eq(accountDeletionTokens.token, token),
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

		if (tokenRow.usedAt) {
			throw createError({
				statusCode: 400,
				statusMessage: "Token has already been used",
			});
		}

		const [accountRow] = await tx
			.select({ id: accounts.id })
			.from(accounts)
			.where(eq(accounts.id, tokenRow.accountId))
			.limit(1);

		if (!accountRow) {
			throw createError({
				statusCode: 400,
				statusMessage: "Account not found",
			});
		}

		await tx.delete(accounts).where(eq(accounts.id, tokenRow.accountId));
	});

	return { ok: true };
});
