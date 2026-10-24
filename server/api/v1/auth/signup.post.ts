import { useDb } from "#server/db";
import { accounts } from "#server/db/schema/accounts";
import { profileLinks, profiles } from "#server/db/schema/profiles";
import {
	appearanceSettings,
	privacySettings,
} from "#server/db/schema/settings";
import { referralCodes, referrals } from "~~/server/db/schema/referrals";
import { and, eq, isNull, gt, or } from "drizzle-orm";

import { verifyBeamProfile } from "#server/utils/beam";
import { generateHexId } from "#server/utils/ids";
import { hashPassword } from "#server/utils/password";

import type { H3Event } from "h3";

import {
	giveBeamBadge,
	giveReferralBadge,
	giveSignupBadges,
} from "#server/jobs/signup";

type SignupPayload = {
	email: string;
	password: string;
	username: string;
	display_name: string | null;
	birthday: Date;
	token?: string;
	referrer?: string;
	termsOfServiceConsent: boolean;
	privacyPolicyConsent: boolean;
};

function normalizePayload(value: unknown): SignupPayload | null {
	if (typeof value !== "object" || value === null) return null;

	const email = normalizeEmail((value as any).email);
	const password = normalizePassword((value as any).password);
	const username =
		typeof (value as any).username === "string"
			? (value as any).username.trim()
			: null;
	const displayName =
		typeof (value as any).display_name === "string"
			? (value as any).display_name.trim()
			: null;
	const token =
		typeof (value as any).token === "string"
			? (value as any).token.trim()
			: null;
	const referrer = normalizeCode((value as any).referrer);
	const birthday = (value as any).birthday
		? new Date((value as any).birthday)
		: null;

	if (!email || !password || !username || !birthday) return null;

	return {
		email,
		password,
		username,
		display_name: displayName || undefined,
		birthday,
		token: token || undefined,
		referrer: referrer || undefined,
		termsOfServiceConsent: (value as any).termsOfServiceConsent === true,
		privacyPolicyConsent: (value as any).privacyPolicyConsent === true,
	};
}

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

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const body = await readBody(event);

	const payload = normalizePayload(body);

	if (!payload) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid signup payload",
		});
	}

	const { email, password, username, token, referrer } = payload;

	const termsOfServiceConsent = body?.termsOfServiceConsent === true;
	const privacyPolicyConsent = body?.privacyPolicyConsent === true;

	if (!email || !password || !username) {
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

	const beamProfile = await verifyBeamProfile(username, token);

	const name = beamProfile?.name || username;

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

	const displayName = beamProfile?.display_name || null;
	const bio = beamProfile?.description || null;
	const pronouns = beamProfile?.pronouns || null;
	const birthday = beamProfile?.birthday
		? new Date(beamProfile?.birthday).toISOString().split("T")[0]
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
				bio,
				pronouns,
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

		if (beamProfile) {
			await tx.insert(profileLinks).values({
				profileId: profile.id,
				name: beamProfile?.display_name || beamProfile?.name,
				type: "beam",
				url: `https://beam.ejnalo.me/@${beamProfile?.name}`,
				resourceId: beamProfile?.id,
				resourceName: beamProfile?.name,
			});
		}

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
							gt(referralCodes.expiresAt, new Date()),
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

		return {
			account,
			profile,
		};
	});

	if (beamProfile) {
		try {
			await giveBeamBadge(
				event,
				result.profile!.id,
				new Date(beamProfile.creation_date),
			);
		} catch (error) {
			console.error("Error occurred while giving Beam badge:", error);
		}
	}

	try {
		await giveSignupBadges(event, result.profile!.id);
	} catch (error) {
		console.error("Error occurred while giving signup badges:", error);
	}

	return {
		account: result.account,
		profile: result.profile,
	};
});
