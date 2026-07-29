import { eq } from "drizzle-orm";
import { setCookie } from "h3";

import { useDb } from "#server/db";
import { accounts, sessions } from "#server/db/schema/accounts";
import { profiles } from "#server/db/schema/profiles";
import { appearance_settings, privacy_settings } from "#server/db/schema/settings";

import { generateHexId } from "#server/utils/ids";
import { signAccessToken, signRefreshToken } from "#server/utils/jwt";
import { hashPassword } from "#server/utils/password";

function normalizeEmail(value: unknown): string | null {
	if (typeof value !== "string") return null;

	const email = value.trim().toLowerCase();
	if (!email || !/^.+@.+\..+$/u.test(email)) return null;

	return email;
}

function normalizeName(value: unknown): string | null {
	if (typeof value !== "string") return null;

	const name = value.trim();
	if (name.length < 3 || name.length > 16) return null;
	if (!/^[a-zA-Z0-9_]+$/u.test(name)) return null;

	return name;
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

function normalizeOptionalString(value: unknown): string | null {
	if (typeof value !== "string") return null;

	const trimmed = value.trim();

	return trimmed.length ? trimmed : null;
}

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const body = await readBody(event);

	const email = normalizeEmail(body?.email);
	const name = normalizeName(body?.name);
	const password = normalizePassword(body?.password);
	const displayName = normalizeOptionalString(body?.displayName);

	if (!email || !name || !password) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid signup payload",
		});
	}

	const [emailMatch] = await db
		.select({ id: accounts.id })
		.from(accounts)
		.where(eq(accounts.email, email))
		.limit(1);

	if (emailMatch) {
		throw createError({
			statusCode: 409,
			statusMessage: "Email already in use",
		});
	}

	const [nameMatch] = await db
		.select({ id: profiles.id })
		.from(profiles)
		.where(eq(profiles.name, name))
		.limit(1);

	if (nameMatch) {
		throw createError({
			statusCode: 409,
			statusMessage: "Profile name already in use",
		});
	}

	const passwordHash = await hashPassword(password);
	const profileId = generateHexId();
	const ipAddress = getRequestIP(event) ?? null;
	const userAgent = getHeader(event, "user-agent") ?? null;

	const result = await db.transaction(async (tx) => {
		const [account] = await tx
			.insert(accounts)
			.values({ email, passwordHash })
			.returning({ id: accounts.id, email: accounts.email });

		await tx.insert(appearance_settings).values({
			accountId: account!.id,
		});

		await tx.insert(privacy_settings).values({
			accountId: account!.id,
		});

		const [profile] = await tx
			.insert(profiles)
			.values({
				id: profileId,
				accountId: account!.id,
				name,
				displayName,
				level: 2,
			})
			.returning({
				id: profiles.id,
				name: profiles.name,
				displayName: profiles.displayName,
			});

		const accessToken = await signAccessToken(
			{
				sub: account!.id,
				email: account!.email,
				profileId: profile!.id,
			},
			{ subject: account!.id },
		);

		const refreshToken = await signRefreshToken(
			{ sub: account!.id, profileId: profile!.id },
			{ subject: account!.id },
		);

		await tx.insert(sessions).values({
			accountId: account!.id,
			token: refreshToken,
			ipAddress,
			userAgent,
		});

		return { account, profile, accessToken, refreshToken };
	});

	setCookie(event, "refreshToken", result.refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 30,
	});

	setCookie(event, "accessToken", result.accessToken, {
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 15,
	});

	return {
		account: result.account,
		profile: result.profile,
		accessToken: result.accessToken,
		refreshToken: result.refreshToken,
	};
});
