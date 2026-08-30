import { eq } from "drizzle-orm";

import { createDb } from "#server/db";
import { accounts, sessions } from "#server/db/schema/accounts";
import { profiles } from "#server/db/schema/profiles";
import { signAccessToken, signRefreshToken } from "#server/utils/jwt";
import { verifyPassword } from "#server/utils/password";

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

export default defineEventHandler(async (event) => {
	const { db, client } = createDb();

	try {
		const body = await readBody(event);

		const email = normalizeEmail(body?.email);
		const password = normalizePassword(body?.password);

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

		const [profile] = await db
			.select({
				id: profiles.id,
				name: profiles.name,
				displayName: profiles.displayName,
			})
			.from(profiles)
			.where(eq(profiles.accountId, account.id))
			.limit(1);

		if (!profile) {
			throw createError({
				statusCode: 500,
				statusMessage: "Profile not found",
			});
		}

		const payload = {
			sub: account.id,
			profileId: profile.id,
		};

		const accessToken = await signAccessToken(payload, {
			subject: account.id,
		});

		const refreshToken = await signRefreshToken(payload, {
			subject: account.id,
		});

		const ipAddress = getRequestIP(event) ?? null;
		const userAgent = getHeader(event, "user-agent") ?? null;

		await db.insert(sessions).values({
			accountId: account.id,
			token: refreshToken,
			ipAddress,
			userAgent,
		});

		setCookie(event, "refreshToken", refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: 60 * 60 * 24 * 30,
		});

		setCookie(event, "accessToken", accessToken, {
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: 60 * 15,
		});

		return {
			accessToken,
			refreshToken,
			profile: {
				id: profile.id,
				name: profile.name,
				displayName: profile.displayName,
			},
		};
	} finally {
		await client.end();
	}
});
