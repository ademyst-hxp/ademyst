import { useDb } from "#server/db";
import { accountModificationHistory, accounts, emailConfirmationTokens } from "#server/db/schema/accounts";
import { profiles } from "#server/db/schema/profiles";
import { levelsEntitlements } from "~~/server/db/schema/entitlements";
import { referrals } from "~~/server/db/schema/referrals";
import { eq } from "drizzle-orm";

import { createError, readBody } from "h3";

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
			data: {
				ok: false,
				email: null,
			},
		});
	}

	const result = await db.transaction(async (tx) => {
		const [tokenRow] = await tx
			.select()
			.from(emailConfirmationTokens)
			.where(eq(emailConfirmationTokens.token, token))
			.limit(1);

		if (!tokenRow) {
			throw createError({
				statusCode: 400,
				statusMessage: "Invalid token",
				data: {
					ok: false,
					email: null,
				},
			});
		}

		if (tokenRow.revoked) {
			throw createError({
				statusCode: 400,
				statusMessage: "Token revoked",
				data: {
					ok: false,
					email: tokenRow.email,
				},
			});
		}

		if (tokenRow.usedAt) {
			throw createError({
				statusCode: 400,
				statusMessage: "Token already used",
				data: {
					ok: false,
					email: tokenRow.email,
				},
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
				data: {
					ok: false,
					email: tokenRow.email,
				},
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
			.set({ usedAt: new Date() })
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

		try {
			const profileId = await tx
				.select({ id: profiles.id })
				.from(profiles)
				.where(eq(profiles.accountId, tokenRow.accountId))
				.limit(1)
				.then((rows) => (rows.length ? rows[0]?.id : null));

			if (!profileId) {
				throw createError({
					statusCode: 500,
					statusMessage: "Failed to find profile",
					data: {
						ok: false,
						email: tokenRow.email,
					},
				});
			}

			await tx.insert(levelsEntitlements).values({
				levelId: 3,
				profileId,
				name: "Grade 'Membre'",
				reason: "Adresse e-mail confirmée",
				createdAt: new Date(),
			});
		} catch {
			tx.rollback();
			throw createError({
				statusCode: 500,
				statusMessage: "Failed to grant entitlements",
				data: {
					ok: false,
					email: tokenRow.email,
				},
			});
		}

		const [myReferral] = await tx
			.select()
			.from(referrals)
			.where(eq(referrals.referredId, tokenRow.accountId))
			.limit(1);

		if (myReferral) {
			await tx
				.update(referrals)
				.set({ confirmed: true, confirmedAt: new Date() })
				.where(eq(referrals.id, myReferral.id));
		}

		return tokenRow.email;
	});

	return { ok: true, email: result };
});
