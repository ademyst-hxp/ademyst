import { useDb } from "#server/db";
import { accountModificationHistory, accounts, emailChangeTokens, emailConfirmationTokens } from "#server/db/schema/accounts";
import { and, eq } from "drizzle-orm";

import { createError, readBody } from "h3";

function normalizeToken(value: unknown): string | null {
	if (typeof value !== "string") return null;

	const token = value.trim();

	return token.length ? token : null;
}

function normalizeEmail(value: unknown): string | null {
	if (typeof value !== "string") return null;

	const email = value.trim().toLowerCase();
	if (!email || !/^.+@.+\..+$/u.test(email)) return null;

	return email;
}

async function buildConfirmationEmail(
	email: string,
	confirmationToken: string,
	userAgent: string | null,
	ipAddress: string | null,
) {
	await sendEmailConfirmation(
		email,
		`${process.env.APP_URL}/account/confirm-email?token=${confirmationToken}`,
		new Date(),
		userAgent ?? "unknown",
		ipAddress ?? "unknown",
	);
}

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const body = await readBody(event);

	const token = normalizeToken(body?.token);
	const email = normalizeEmail(body?.email);

	if (!token) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid payload",
		});
	}

	if (!email) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid email",
		});
	}

	await db.transaction(async (tx) => {
		const [tokenRow] = await tx
			.select()
			.from(emailChangeTokens)
			.where(
				and(
					eq(emailChangeTokens.token, token),
					eq(emailChangeTokens.revoked, false),
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
			.select()
			.from(accounts)
			.where(eq(accounts.id, tokenRow.accountId))
			.limit(1);

		if (!accountRow) {
			throw createError({
				statusCode: 400,
				statusMessage: "Account not found",
			});
		}

		await tx
			.update(accounts)
			.set({
				email,
				confirmedAt: null, // Reset confirmedAt to null to require re-confirmation of the new email
			})
			.where(eq(accounts.id, tokenRow.accountId));

		await tx
			.update(emailChangeTokens)
			.set({
				usedAt: new Date(),
			})
			.where(eq(emailChangeTokens.id, tokenRow.id));

		// Log this to the account modification history
		const safeIp = getRequestIP(event) ?? null;
		const safeUserAgent = getHeader(event, "user-agent") ?? null;

		await tx.insert(accountModificationHistory).values({
			accountId: accountRow.id,
			action: "email_change",
			ipAddress: safeIp,
			userAgent: safeUserAgent,
		});

		// Trigger a new email confirmation process for the new email address
		const confirmationToken = generateHexToken(32);

		await tx.insert(emailConfirmationTokens).values({
			accountId: accountRow.id,
			email: accountRow.email,
			token: confirmationToken,
		});

		const userAgent = getHeader(event, "user-agent") ?? null;
		const ipAddress = getRequestIP(event) ?? null;

		try {
			await buildConfirmationEmail(
				accountRow.email,
				confirmationToken,
				userAgent,
				ipAddress,
			);
		} catch (error) {
			console.error("Failed to build confirmation email:", error);
			throw createError({
				statusCode: 500,
				statusMessage: "Failed to send confirmation email",
				data: {
					ok: false,
					email: accountRow.email,
				},
			});
		}
	});

	return { ok: true, email };
});
