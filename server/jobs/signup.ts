import { H3Event } from "h3";
import { useDb } from "../db";
import { count } from "drizzle-orm";

import { profiles } from "../db/schema/profiles";

import type { BadgeEntitlement as DbBadgeEntitlement } from "../db/schema/entitlements";
import { badgesEntitlements } from "../db/schema/entitlements";

const EARLY_BIRD_MAX_DATE = new Date("2026-10-31T23:59:59.999Z");

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
