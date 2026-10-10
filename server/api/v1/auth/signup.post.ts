import type { H3Event } from "h3";

import { useDb } from "#server/db";
import { and, or, eq, lt, isNull } from "drizzle-orm";
import {
	accounts,
	sessions,
	emailConfirmationTokens,
} from "#server/db/schema/accounts";
import { profiles, profileLinks } from "#server/db/schema/profiles";
import { referrals, referralCodes } from "~~/server/db/schema/referrals";
import {
	appearanceSettings,
	privacySettings,
} from "#server/db/schema/settings";

import { generateHexId } from "#server/utils/ids";
import { signAccessToken, signRefreshToken } from "#server/utils/jwt";
import { hashPassword } from "#server/utils/password";
import { verifyBeamProfile } from "#server/utils/beam";
import { sendEmailConfirmation } from "#server/utils/mail";

import {
	giveBeamBadge,
	giveReferralBadge,
	giveSignupBadges,
} from "#server/jobs/signup";

function normalizeEmail(value: unknown): string | null {
	if (typeof value !== "string") return null;

	const email = value.trim().toLowerCase();
	if (!email || !/^.+@.+\..+$/u.test(email)) return null;

	return email;
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

function normalizeCode(value: unknown): string | null {
	if (typeof value !== "string") return null;

	const code = value.trim().toUpperCase();
	if (!code || !/^[A-Fa-f0-9]{6,10}$/u.test(code)) return null;

	return code;
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

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const body = await readBody(event);

	const email = normalizeEmail(body?.email);
	const password = normalizePassword(body?.password);
	const referrer = normalizeCode(body?.referrer);

	// The sudo token is mandatory and is used to retrieve the Beam profile.
	const token =
		typeof body?.token === "string" ? body.token.trim() : null;

	const termsOfServiceConsent = body?.termsOfServiceConsent === true;

	const privacyPolicyConsent = body?.privacyPolicyConsent === true;

	if (!email || !password || !token) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid signup payload",
		});
	}

	if (!termsOfServiceConsent || !privacyPolicyConsent) {
		throw createError({
			statusCode: 400,
			statusMessage:
				"Terms of service and privacy policy consent are required",
		});
	}

	/*
	 * No account/profile is created before this succeeds.
	 *
	 * This guarantees that a signup always has a valid Beam
	 * verification associated with it.
	 */
	const beamProfile = await verifyBeamProfile(token);

	/*
	 * The local profile name is always taken from the verified
	 * Beam profile.
	 */
	const name = beamProfile.name;

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

	const displayName = beamProfile.display_name || null;

	const birthday = beamProfile.birthday
		? new Date(beamProfile.birthday).toISOString().split("T")[0]
		: null;

	const result = await db.transaction(async (tx) => {
		const [account] = await tx
			.insert(accounts)
			.values({
				email,
				passwordHash,
			})
			.returning({
				id: accounts.id,
				email: accounts.email,
			});

		if (!account) {
			throw createError({
				statusCode: 500,
				statusMessage: "Failed to create account",
			});
		}

		await tx.insert(appearanceSettings).values({
			accountId: account.id,
		});

		await tx.insert(privacySettings).values({
			accountId: account.id,
		});

		const [profile] = await tx
			.insert(profiles)
			.values({
				id: profileId,
				accountId: account.id,
				name,
				displayName,
				bio: beamProfile.description || null,
				pronouns: beamProfile.pronouns || null,
				birthday,
				level: 2,
			})
			.returning({
				id: profiles.id,
				name: profiles.name,
				displayName: profiles.displayName,
			});

		if (!profile) {
			throw createError({
				statusCode: 500,
				statusMessage: "Failed to create profile",
			});
		}

		await tx.insert(profileLinks).values({
			profileId: profile.id,
			name: beamProfile.display_name || beamProfile.name,
			type: "beam",
			url: `https://beam.ejnalo.me/${beamProfile.name}`,
			resourceId: beamProfile.id,
			resourceName: beamProfile.name,
		});

		const accessToken = await signAccessToken(
			{
				sub: account.id,
				email: account.email,
				profileId: profile.id,
			},
			{ subject: account.id },
		);

		const refreshToken = await signRefreshToken(
			{
				sub: account.id,
				profileId: profile.id,
			},
			{ subject: account.id },
		);

		await tx.insert(sessions).values({
			accountId: account.id,
			token: refreshToken,
			ipAddress,
			userAgent,
		});

		/* Parrainage */

		if (referrer) {
			const [referralCode] = await tx
				.select()
				.from(referralCodes)
				.where(
					and(
						eq(referralCodes.code, referrer),
						eq(referralCodes.enabled, true),
						or(
							isNull(referralCodes.expiresAt),
							lt(referralCodes.expiresAt, new Date()),
						),
					),
				)
				.limit(1);

			if (referralCode) {
				await tx.insert(referrals).values({
					code: referralCode.code,
					referredId: profile.id,
				});

				await giveReferralBadge(tx, referralCode.code);
			}
		}

		/* Confirmation de l'email */

		const confirmationToken = generateHexId();

		await tx.insert(emailConfirmationTokens).values({
			accountId: account.id,
			email: account.email,
			token: confirmationToken,
		});

		await buildConfirmationEmail(
			account.email,
			confirmationToken,
			userAgent,
			ipAddress,
		);

		return {
			account,
			profile,
			accessToken,
			refreshToken,
		};
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

	try {
		await giveBeamBadge(
			event,
			result.profile!.id,
			new Date(beamProfile.creation_date),
		);
	} catch (error) {
		console.error("Error occurred while giving Beam badge:", error);
	}

	try {
		await giveSignupBadges(event, result.profile!.id);
	} catch (error) {
		console.error("Error occurred while giving signup badges:", error);
	}

	return {
		account: result.account,
		profile: result.profile,
		accessToken: result.accessToken,
		refreshToken: result.refreshToken,
	};
});
