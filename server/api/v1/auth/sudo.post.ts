import { randomBytes } from "node:crypto";

import { createError, getHeader, getRequestIP, readBody } from "h3";
import { eq } from "drizzle-orm";

import { createDb } from "#server/db";
import {
	accountDeletionTokens,
	accounts,
	emailConfirmationTokens,
	passwordResetTokens,
} from "#server/db/schema/accounts";
import { verifyPassword } from "#server/utils/password";

const TOKEN_BYTES = 32;

function normalizeEmail(value: unknown): string | null {
	if (typeof value !== "string") return null;

	const email = value.trim().toLowerCase();
	if (!email || !/^.+@.+\..+$/u.test(email)) return null;

	return email;
}

function normalizePassword(value: unknown): string | null {
	if (typeof value !== "string") return null;

	if (value.length < 8) return null;

	return value;
}

function generateToken(): string {
	return randomBytes(TOKEN_BYTES).toString("hex");
}

export default defineEventHandler(async (event) => {
	const { db, client } = createDb();

	try {
		const body = await readBody(event);

		const action = event.context.params?.action;

		const email = normalizeEmail(body?.email);
		const newEmail = normalizeEmail(body?.newEmail);
		const password = normalizePassword(body?.password);

		if (
			!action ||
			!["change-password", "change-email", "delete-account"].includes(
				action,
			)
		) {
			throw createError({
				statusCode: 400,
				statusMessage: "Invalid action",
			});
		}

		if (!email || !password) {
			throw createError({
				statusCode: 400,
				statusMessage: "Invalid login payload",
			});
		}

		const [account] = await db
			.select({
				id: accounts.id,
				email: accounts.email,
				passwordHash: accounts.passwordHash,
			})
			.from(accounts)
			.where(eq(accounts.email, email))
			.limit(1);

		if (!account) {
			throw createError({
				statusCode: 401,
				statusMessage: "Invalid credentials",
			});
		}

		const passwordOk = await verifyPassword(password, account.passwordHash);
		if (!passwordOk) {
			throw createError({
				statusCode: 401,
				statusMessage: "Invalid credentials",
			});
		}

		const ipAddress = getRequestIP(event) ?? null;
		const userAgent = getHeader(event, "user-agent") ?? null;
		const token = generateToken();

		switch (action) {
			case "change-password":
				await db.insert(passwordResetTokens).values({
					accountId: account.id,
					token,
					ipAddress,
					userAgent,
				});

				break;
			case "change-email":
				if (!newEmail) {
					throw createError({
						statusCode: 400,
						statusMessage: "Invalid new email",
					});
				}

				await db.insert(emailConfirmationTokens).values({
					accountId: account.id,
					token,
					email: newEmail,
					ipAddress,
					userAgent,
				});

				break;
			case "delete-account":
				await db.insert(accountDeletionTokens).values({
					accountId: account.id,
					token,
					ipAddress,
					userAgent,
				});

				break;
			default:
				throw createError({
					statusCode: 400,
					statusMessage: "Invalid action",
				});
		}

		return { action, token };
	} finally {
		await client.end();
	}
});
