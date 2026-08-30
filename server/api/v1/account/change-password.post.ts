import { randomBytes } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";

import { createDb } from "#server/db";
import { accounts, passwordResetTokens, accountModificationHistory } from "#server/db/schema/accounts";

import { hashPassword } from "#server/utils/password";

const TOKEN_BYTES = 32;

function generateToken(): string {
	return randomBytes(TOKEN_BYTES).toString("hex");
}

function normalizeToken(value: unknown): string | null {
	if (typeof value !== "string") return null;

	const token = value.trim();

	return token.length ? token : null;
}

function normalizePassword(value: unknown): string | null {
	if (typeof value !== "string") return null;

	if (value.length < 8) return null;
	if (!/[A-Z]/u.test(value)) return null;
	if (!/[a-z]/u.test(value)) return null;
	if (!/[0-9]/u.test(value)) return null;
	if (!/[^A-Za-z0-9]/u.test(value)) return null;

	return value;
}

function getAppUrl(): string {
	const baseUrl = process.env.APP_URL?.trim();
	if (!baseUrl) {
		throw createError({
			statusCode: 500,
			statusMessage: "APP_URL is not configured",
		});
	}

	return baseUrl.replace(/\/+$/u, "");
}

export default defineEventHandler(async (event) => {
	const { db, client } = createDb();

	try {
		const body = await readBody(event);

		const token = normalizeToken(body?.token);
		const newPassword = normalizePassword(body?.newPassword ?? body?.password);

		if (!token || !newPassword) {
			throw createError({
				statusCode: 400,
				statusMessage: "Invalid payload",
			});
		}

		const passwordHash = await hashPassword(newPassword);

		const [tokenRow] = await db
			.select({
				id: passwordResetTokens.id,
				accountId: passwordResetTokens.accountId,
			})
			.from(passwordResetTokens)
			.where(
				and(
					eq(passwordResetTokens.token, token),
					isNull(passwordResetTokens.usedAt),
					eq(passwordResetTokens.revoked, false),
				),
			)
			.limit(1);

		if (!tokenRow) {
			throw createError({
				statusCode: 400,
				statusMessage: "Invalid or expired token",
			});
		}

		const [account] = await db
			.select()
			.from(accounts)
			.where(eq(accounts.id, tokenRow?.accountId ?? ""))
			.limit(1);

		if (!account) {
			throw createError({
				statusCode: 400,
				statusMessage: "Invalid or expired token",
			});
		}

		await db.transaction(async (tx) => {
			await tx
				.update(accounts)
				.set({ passwordHash, updatedAt: new Date() })
				.where(eq(accounts.id, tokenRow.accountId));

			await tx
				.update(passwordResetTokens)
				.set({ usedAt: new Date(), revoked: true })
				.where(eq(passwordResetTokens.id, tokenRow.id));
		});

		try {
			const ipAddress = getRequestIP(event) ?? null;
			const userAgent = getHeader(event, "user-agent") ?? null;
			const newToken = generateToken();

			await db.insert(passwordResetTokens).values({
				accountId: account.id,
				token: newToken,
				ipAddress,
				userAgent,
			});

			const resetUrl = `${getAppUrl()}/account/reset-password?token=${encodeURIComponent(newToken)}`;
			const timestamp = new Date();
			const safeUserAgent = userAgent ?? "unknown";
			const safeIp = ipAddress ?? "unknown";

			await sendPasswordChangedEmail(
				account.email,
				resetUrl,
				timestamp,
				safeUserAgent,
				safeIp,
			);

			await db.insert(accountModificationHistory).values({
				accountId: account.id,
				action: "password_change",
				ipAddress: safeIp,
				userAgent: safeUserAgent,
			});
		} catch {
			// Password change already succeeded; notification failures should not fail the request.
		}
	} finally {
		await client.end();
	}
});
