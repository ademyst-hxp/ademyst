import { createError, readBody } from "h3";
import { and, eq, isNull } from "drizzle-orm";

import { useDb } from "#server/db";
import {
	accountModificationHistory,
	accounts,
	emailConfirmationTokens,
} from "#server/db/schema/accounts";

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
	const email = normalizeEmail(body?.email);

	if (!email) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid payload",
		});
	}

	const [account] = await db
		.select({
			id: accounts.id,
			email: accounts.email,
		})
		.from(accounts)
		.where(eq(accounts.email, email))
		.limit(1);

	if (!account) {
		throw createError({
			statusCode: 404,
			statusMessage: "Account not found",
		});
	}

	const confirmationToken = generateHexId(32);

	await db.insert(emailConfirmationTokens).values({
		accountId: account.id,
		email: account.email,
		token: confirmationToken,
	});

	const userAgent = getHeader(event, "user-agent") ?? null;
	const ipAddress = getRequestIP(event) ?? null;

	await buildConfirmationEmail(
		account.email,
		confirmationToken,
		userAgent,
		ipAddress,
	);
});
