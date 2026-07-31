import { createError, readBody } from "h3";
import { and, eq, isNull } from "drizzle-orm";

import { useDb } from "#server/db";
import {
	accountModificationHistory,
	accounts,
	emailConfirmationTokens,
} from "#server/db/schema/accounts";

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

	const result = await db.transaction(async (tx) => {
		const [tokenRow] = await tx
			.select({
				id: emailConfirmationTokens.id,
				accountId: emailConfirmationTokens.accountId,
				email: emailConfirmationTokens.email,
			})
			.from(emailConfirmationTokens)
			.where(
				and(
					eq(emailConfirmationTokens.token, token),
					isNull(emailConfirmationTokens.usedAt),
					eq(emailConfirmationTokens.revoked, false),
				),
			)
			.limit(1);

		if (!tokenRow) {
			throw createError({
				statusCode: 400,
				statusMessage: "Invalid or expired token",
			});
		}

		const [emailMatch] = await tx
			.select({ id: accounts.id })
			.from(accounts)
			.where(eq(accounts.email, tokenRow.email))
			.limit(1);

		if (emailMatch && emailMatch.id !== tokenRow.accountId) {
			throw createError({
				statusCode: 409,
				statusMessage: "Email already in use",
			});
		}

		await tx
			.update(accounts)
			.set({
				email: tokenRow.email,
				confirmedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(accounts.id, tokenRow.accountId));

		await tx
			.update(emailConfirmationTokens)
			.set({ usedAt: new Date(), revoked: true })
			.where(eq(emailConfirmationTokens.id, tokenRow.id));

		try {
			const ipAddress = getRequestIP(event) ?? null;
			const userAgent = getHeader(event, "user-agent") ?? null;

			const safeUserAgent = userAgent ?? "unknown";
			const safeIp = ipAddress ?? "unknown";

			await tx.insert(accountModificationHistory).values({
				accountId: tokenRow.accountId,
				action: "email_confirmation",
				ipAddress: safeIp,
				userAgent: safeUserAgent,
			});
		} catch {
			// Email confirmation already succeeded; notification failures should not fail the request.
		}

		return tokenRow.email;
	});

	return { ok: true, email: result };
});
