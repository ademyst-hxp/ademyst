import { H3Event } from "h3";
import { useDb, type DbTransaction } from "../db";
import { count, eq, and } from "drizzle-orm";

import { profiles } from "../db/schema/profiles";

import type { BadgeEntitlement as DbBadgeEntitlement } from "../db/schema/entitlements";
import { badgesEntitlements } from "../db/schema/entitlements";

import { referralCodes, referrals } from "../db/schema/referrals";

const EARLY_BIRD_MAX_DATE = new Date("2026-10-31T23:59:59.999Z");
const BEAM_BADGE_MAX_DATE = new Date(
	useRuntimeConfig().public.beamVerificationDeadline,
);

export async function giveSignupBadges(
	event: H3Event,
	profileId: string,
): Promise<void> {
	const db = useDb(event);

	const _badges_to_put: Omit<
		DbBadgeEntitlement,
		"id" | "revoked" | "updatedAt" | "expiresAt"
	>[] = [];

	if (new Date() <= EARLY_BIRD_MAX_DATE) {
		_badges_to_put.push({
			profileId,
			badgeId: "early_bird",
			name: "Badge Early Bird Offert",
			reason: "Vous avez rejoint la communauté dès les deux premiers mois.",
			enabled: false,
			createdAt: new Date(),
		});
	}

	const memberCount = await db
		.select({ count: count() })
		.from(profiles)
		.limit(1)
		.then((res) => res[0]?.count ?? 0);

	if (memberCount < 100) {
		_badges_to_put.push({
			profileId: profileId,
			badgeId: "the_hundred",
			name: "Les 100",
			reason: "Vous êtes l'un des 100 premiers à avoir rejoint la communauté.",
			enabled: false,
			createdAt: new Date(),
		});
	}

	await db.insert(badgesEntitlements).values(_badges_to_put);
}

export async function giveBeamBadge(
	event: H3Event,
	profileId: string,
	profileSignupDate: Date,
): Promise<void> {
	const db = useDb(event);

	if (profileSignupDate <= BEAM_BADGE_MAX_DATE) {
		await db.insert(badgesEntitlements).values({
			profileId: profileId,
			badgeId: "first_hour",
			name: "Badge Beam Offert",
			reason:
				"Vous avez rejoint la communauté avant le " +
				BEAM_BADGE_MAX_DATE.toLocaleDateString("fr-FR", {
					month: "long",
					day: "numeric",
					year: "numeric",
				}) +
				".",
			enabled: true,
			createdAt: new Date(),
		});
	}
}

// Runs on the caller's transaction: the request has a single connection, so
// querying outside of it while the transaction is open would never resolve.
export async function giveReferralBadge(
	db: DbTransaction,
	issuerId: string,
	code: string,
): Promise<void> {
	const [invite] = await db
		.select()
		.from(referralCodes)
		.where(eq(referralCodes.code, code))
		.limit(1);

	if (!invite) {
		return;
	}

	const [referralCount] = await db
		.select({ count: count() })
		.from(referrals)
		.where(and(eq(referrals.code, code), eq(referrals.confirmed, true)))
		.limit(1);

	if ((referralCount?.count ?? 0) < 5) return;

	await db.insert(badgesEntitlements).values({
		profileId: issuerId,
		badgeId: "parrain",
		name: "Badge Parrain Offert",
		reason: "Vous avez parrainé 5 personnes ou plus à la communauté.",
		enabled: true,
		createdAt: new Date(),
	});

	if ((referralCount?.count ?? 0) < 10) return;

	await db.insert(badgesEntitlements).values({
		profileId: issuerId,
		badgeId: "me_and_my_friends",
		name: "Badge Mes Amis et Moi Offert",
		reason: "Vous avez parrainé 10 personnes ou plus à la communauté.",
		enabled: true,
		createdAt: new Date(),
	});

	if ((referralCount?.count ?? 0) < 20) return;

	await db.insert(badgesEntitlements).values({
		profileId: issuerId,
		badgeId: "the_ambassador",
		name: "Badge Ambassadeur Offert",
		reason: "Vous avez parrainé 20 personnes ou plus à la communauté.",
		enabled: true,
		createdAt: new Date(),
	});

	if ((referralCount?.count ?? 0) < 50) return;

	await db.insert(badgesEntitlements).values({
		profileId: issuerId,
		badgeId: "the_user_trader",
		name: "Badge Le Trafficant d'Utilisateurs Offert",
		reason: "Vous avez parrainé 50 personnes ou plus à la communauté.",
		enabled: true,
		createdAt: new Date(),
	});
}
