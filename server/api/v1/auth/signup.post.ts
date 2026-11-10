import { useDb } from "#server/db";
import { accounts } from "#server/db/schema/accounts";
import { profiles } from "#server/db/schema/profiles";
import {
	appearanceSettings,
	privacySettings,
} from "#server/db/schema/settings";
import { referralCodes, referrals } from "~~/server/db/schema/referrals";

import { and, eq, isNull, gt, or } from "drizzle-orm";

import { generateHexId } from "#server/utils/ids";
import { hashPassword } from "#server/utils/password";

import type { H3Event } from "h3";

import { giveReferralBadge, giveSignupBadges } from "#server/jobs/signup";

// Ces valeurs doivent rester identiques à celles de la page d'inscription.
const USERNAME_REGEX = /^[a-z][a-z0-9_]{2,15}$/;
const DISPLAY_NAME_MAX_LENGTH = 32;
const MIN_AGE = 15;
const MIN_BIRTH_YEAR = 1900;

type SignupPayload = {
	email: string;
	password: string;
	username: string;
	display_name: string | null;
	birthday: Date;
	referrer?: string;
	termsOfServiceConsent: boolean;
	privacyPolicyConsent: boolean;
};

function badRequest(message: string) {
	return createError({
		statusCode: 400,
		statusMessage: message,
	});
}

function normalizePayload(value: unknown): SignupPayload | null {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return null;
	}

	const body = value as Record<string, unknown>;

	// Email validation.
	const email = normalizeEmail(body.email);

	if (!email) {
		throw badRequest("Invalid email");
	}

	// Password validation.
	const password = normalizePassword(body.password);

	if (!password) {
		throw badRequest("Invalid password");
	}

	// Username validation.
	const username =
		typeof body.username === "string"
			? body.username.trim().toLowerCase()
			: "";

	if (!USERNAME_REGEX.test(username)) {
		throw badRequest(
			"Invalid username: 3 to 16 characters, lowercase letters, digits and underscores only, starting with a letter",
		);
	}

	// Display name validation.
	const displayName =
		typeof body.display_name === "string" ? body.display_name.trim() : null;

	if (displayName !== null && displayName.length > DISPLAY_NAME_MAX_LENGTH) {
		throw badRequest(
			`Display name must be at most ${DISPLAY_NAME_MAX_LENGTH} characters`,
		);
	}

	const referrer = normalizeCode(body.referrer);

	// Birthday validation.
	const birthday =
		typeof body.birthday === "string" ||
		typeof body.birthday === "number" ||
		body.birthday instanceof Date
			? new Date(body.birthday)
			: null;

	if (
		!birthday ||
		isNaN(birthday.getTime()) ||
		birthday.getUTCFullYear() < MIN_BIRTH_YEAR
	) {
		throw badRequest("Invalid birthday");
	}

	const today = new Date();

	if (birthday > today) {
		throw badRequest("Birthday cannot be in the future");
	}

	// The birthday is stored as a UTC date (see toISOString below), so the age uses UTC too.
	let age = today.getUTCFullYear() - birthday.getUTCFullYear();

	if (
		today.getUTCMonth() < birthday.getUTCMonth() ||
		(today.getUTCMonth() === birthday.getUTCMonth() &&
			today.getUTCDate() < birthday.getUTCDate())
	) {
		age--;
	}

	if (age < MIN_AGE) {
		throw badRequest(
			`You must be at least ${MIN_AGE} years old to sign up`,
		);
	}

	return {
		email,
		password,
		username,
		display_name: displayName || null,
		birthday,
		referrer: referrer || undefined,
		termsOfServiceConsent: body.termsOfServiceConsent === true,
		privacyPolicyConsent: body.privacyPolicyConsent === true,
	};
}

function normalizeEmail(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const email = value.trim().toLowerCase();

	if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
		return null;
	}

	return email;
}

function normalizePassword(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	if (value.length < 8) return null;
	if (!/[A-Z]/u.test(value)) return null;
	if (!/[a-z]/u.test(value)) return null;
	if (!/[0-9]/u.test(value)) return null;
	if (!/[^A-Za-z0-9]/u.test(value)) return null;

	return value;
}

function normalizeCode(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const code = value.trim().toUpperCase();

	if (!code || !/^[A-F0-9]{6,10}$/u.test(code)) {
		return null;
	}

	return code;
}

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	// Parse and validate payload.
	const body = await readBody(event);
	const payload = normalizePayload(body);

	if (!payload) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid signup payload",
		});
	}

	const {
		email,
		password,
		username,
		display_name,
		birthday,
		referrer,
		termsOfServiceConsent,
		privacyPolicyConsent,
	} = payload;

	// Required consents.
	if (!termsOfServiceConsent || !privacyPolicyConsent) {
		throw createError({
			statusCode: 400,
			statusMessage:
				"Terms of service and privacy policy consent are required",
		});
	}

	// Check existing email.
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

	// Check existing username.
	const [nameMatch] = await db
		.select({ id: profiles.id })
		.from(profiles)
		.where(eq(profiles.name, username))
		.limit(1);

	if (nameMatch) {
		throw createError({
			statusCode: 409,
			statusMessage: "Profile name already in use",
		});
	}

	// Prepare account data.
	const passwordHash = await hashPassword(password);
	const profileId = generateHexId();
	const birthdayValue = birthday.toISOString().split("T")[0];

	// Create account and profile atomically.
	let result: {
		account: {
			id: typeof accounts.$inferSelect.id;
			email: typeof accounts.$inferSelect.email;
		};
		profile: {
			id: typeof profiles.$inferSelect.id;
			name: typeof profiles.$inferSelect.name;
			displayName: typeof profiles.$inferSelect.displayName;
		};
	};

	try {
		result = await db.transaction(async (tx) => {
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
				termsOfServiceConsent,
				privacyPolicyConsent,
			});

			const [profile] = await tx
				.insert(profiles)
				.values({
					id: profileId,
					accountId: account.id,
					name: username,
					displayName: display_name,
					birthday: birthdayValue,
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

			// Referral.
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
	} catch (error: any) {
		// Handle database uniqueness conflicts.
		if (
			error?.code === "23505" ||
			error?.cause?.code === "23505" ||
			error?.code === "SQLITE_CONSTRAINT_UNIQUE" ||
			error?.cause?.code === "SQLITE_CONSTRAINT_UNIQUE"
		) {
			throw createError({
				statusCode: 409,
				statusMessage: "Email or profile name already in use",
			});
		}

		throw error;
	}

	// Signup badges are handled outside the transaction.
	try {
		await giveSignupBadges(event, result.profile.id);
	} catch (error) {
		console.error("Error occurred while giving signup badges:", error);
	}

	return {
		account: result.account,
		profile: {
			...result.profile,
			level: 2,
		},
	};
});
