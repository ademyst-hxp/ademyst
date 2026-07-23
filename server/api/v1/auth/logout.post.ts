import { eq } from "drizzle-orm";

import { db } from "#server/db";
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
	const sessionToken = getCookie(event, "refreshToken");

	if (!sessionToken) {
		throw createError({
			statusCode: 401,
			statusMessage: "Not authenticated",
		});
	}

	deleteCookie(event, "refreshToken", {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
	});

	deleteCookie(event, "accessToken", {
		secure: true,
		sameSite: "lax",
	});

	return { ok: true };
});
