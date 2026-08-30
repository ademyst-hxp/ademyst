import { H3Event } from "h3";
import { createDb } from "../db";
import { count } from "drizzle-orm";

import { profiles } from "../db/schema/profiles";

import type { BadgeEntitlement as DbBadgeEntitlement } from "../db/schema/entitlements";
import { badgesEntitlements } from "../db/schema/entitlements";

const EARLY_BIRD_MAX_DATE = new Date("2026-10-31T23:59:59.999Z");
const BEAM_BADGE_MAX_DATE = new Date(
	useRuntimeConfig().public.beamVerificationDeadline,
);

export async function giveSignupBadges(
	event: H3Event,
	profileId: string,
): Promise<void> {
	const { db, client } = createDb();

	try {
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
	} finally {
		await client.end();
	}
}

export async function giveBeamBadge(
	event: H3Event,
	profileId: string,
	profileSignupDate: Date,
): Promise<void> {
	const { db, client } = createDb();

	try {
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
	} finally {
		await client.end();
	}
}
