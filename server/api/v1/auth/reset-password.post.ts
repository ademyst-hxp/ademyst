import { randomBytes } from "node:crypto";

import { eq } from "drizzle-orm";

import { createDb } from "#server/db";
import { accounts, passwordResetTokens } from "#server/db/schema/accounts";
import { sendResetPasswordEmail } from "#server/utils/mail";

const TOKEN_BYTES = 32;

function normalizeEmail(value: unknown): string | null {
	if (typeof value !== "string") return null;

	const email = value.trim().toLowerCase();
	if (!email || !/^.+@.+\..+$/u.test(email)) return null;

	return email;
}

function generateToken(): string {
	return randomBytes(TOKEN_BYTES).toString("hex");
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

		const email = normalizeEmail(body?.email);

		if (!email) {
			throw createError({
				statusCode: 400,
				statusMessage: "Invalid email",
			});
		}

		const [account] = await db
			.select({ id: accounts.id })
			.from(accounts)
			.where(eq(accounts.email, email))
			.limit(1);

		if (!account) {
			return { ok: true };
		}

		const ipAddress = getRequestIP(event) ?? null;
		const userAgent = getHeader(event, "user-agent") ?? null;
		const token = generateToken();

		await db.insert(passwordResetTokens).values({
			accountId: account.id,
			token,
			ipAddress,
			userAgent,
		});

		const resetUrl = `${getAppUrl()}/account/reset-password?token=${encodeURIComponent(token)}`;
		const timestamp = new Date();
		const safeUserAgent = userAgent ?? "unknown";
		const safeIp = ipAddress ?? "unknown";

		await sendResetPasswordEmail(
			email,
			resetUrl,
			timestamp,
			safeUserAgent,
			safeIp,
		);

		return { ok: true };
	} finally {
		await client.end();
	}
});
