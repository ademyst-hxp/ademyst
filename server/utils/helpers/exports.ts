import { type DbTransaction, type useDb } from "~~/server/db";
import { accountModificationHistory, accounts, sessions } from "~~/server/db/schema/accounts";
import { badgesEntitlements, levelsEntitlements } from "~~/server/db/schema/entitlements";
import { dataExports } from "~~/server/db/schema/exports";
import { attachments } from "~~/server/db/schema/drive";
import { postReactions, posts, whisperReactions, whispers } from "~~/server/db/schema/interactions";
import { profileLinks, profiles } from "~~/server/db/schema/profiles";
import { referralCodes, referrals } from "~~/server/db/schema/referrals";
import { blocks, contentSubscriptions, follows, friendships, requests } from "~~/server/db/schema/relations";
import { postReports, profileReports, whisperReports } from "~~/server/db/schema/reports";
import { sanctions } from "~~/server/db/schema/sanctions";
import { appearanceSettings, notificationSettings, privacySettings } from "~~/server/db/schema/settings";
import { and, desc, eq, inArray, ne, or } from "drizzle-orm";

import type { ObjectStorage } from "~~/server/utils/drive";

type Db = ReturnType<typeof useDb> | DbTransaction;

export const EXPORT_BUCKET = "data-exports";

// Un export par compte et par période glissante de 7 jours
export const EXPORT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

// Durée de disponibilité du fichier après sa demande (aussi à régler en "lifecycle rule" sur le bucket)
export const EXPORT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Un export resté "processing" au-delà de ce délai est considéré comme échoué
export const EXPORT_STALE_MS = 15 * 60 * 1000;

const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

export const isUuid = (value: unknown): value is string =>
	typeof value === "string" && UUID_REGEX.test(value);

export const exportKey = (accountId: string, exportId: string) =>
	`${accountId}/${exportId}.json`;

/**
 * Date à partir de laquelle un nouvel export est de nouveau possible,
 * ou null s'il l'est déjà. Les exports échoués ne comptent pas.
 */
export async function getNextExportAt(
	db: Db,
	accountId: string,
	now = new Date(),
): Promise<Date | null> {
	const [last] = await db
		.select({ createdAt: dataExports.createdAt })
		.from(dataExports)
		.where(
			and(
				eq(dataExports.accountId, accountId),
				ne(dataExports.status, "failed"),
			),
		)
		.orderBy(desc(dataExports.createdAt))
		.limit(1);

	if (!last) return null;

	const next = new Date(last.createdAt.getTime() + EXPORT_COOLDOWN_MS);

	return next > now ? next : null;
}

/**
 * Supprime du bucket tous les fichiers d'export d'un compte.
 * À appeler avant la suppression du compte (la cascade SQL ne touche pas S3).
 */
export async function purgeAccountExports(
	db: Db,
	storage: ObjectStorage,
	accountId: string,
): Promise<void> {
	const rows = await db
		.select({ key: dataExports.key })
		.from(dataExports)
		.where(eq(dataExports.accountId, accountId));

	for (const row of rows) {
		if (row.key) {
			await storage.delete(row.key);
		}
	}
}

/**
 * Rassemble les données personnelles d'un compte (art. 15 et 20 RGPD).
 * Exclus volontairement : hash du mot de passe, jetons de session/de
 * réinitialisation, contenus d'autres utilisateurs.
 */
export async function buildAccountExport(
	db: Db,
	accountId: string,
	profileId: string,
) {
	const [account] = await db
		.select({
			id: accounts.id,
			email: accounts.email,
			createdAt: accounts.createdAt,
			updatedAt: accounts.updatedAt,
			confirmedAt: accounts.confirmedAt,
		})
		.from(accounts)
		.where(eq(accounts.id, accountId))
		.limit(1);

	const [profile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, profileId))
		.limit(1);

	const [
		links,
		appearance,
		privacy,
		notifications,
		myPosts,
		myWhispers,
		myPostReactions,
		myWhisperReactions,
		myAttachments,
		myFollows,
		myFriendships,
		myBlocks,
		myRequests,
		mySubscriptions,
		myBadges,
		myLevels,
		myReferralCodes,
		myReferrals,
		mySessions,
		history,
		myProfileReports,
		myPostReports,
		myWhisperReports,
		mySanctions,
	] = await Promise.all([
		db.select().from(profileLinks).where(eq(profileLinks.profileId, profileId)),
		db.select().from(appearanceSettings).where(eq(appearanceSettings.accountId, accountId)),
		db.select().from(privacySettings).where(eq(privacySettings.accountId, accountId)),
		db.select().from(notificationSettings).where(eq(notificationSettings.accountId, accountId)),

		db.select().from(posts).where(eq(posts.profileId, profileId)),
		db.select().from(whispers).where(eq(whispers.profileId, profileId)),
		db.select().from(postReactions).where(eq(postReactions.profileId, profileId)),
		db.select().from(whisperReactions).where(eq(whisperReactions.profileId, profileId)),
		db.select().from(attachments).where(eq(attachments.authorId, profileId)),

		db
			.select()
			.from(follows)
			.where(or(eq(follows.followerId, profileId), eq(follows.followingId, profileId))),
		db
			.select()
			.from(friendships)
			.where(or(eq(friendships.profileAId, profileId), eq(friendships.profileBId, profileId))),
		db.select().from(blocks).where(eq(blocks.blockerId, profileId)),
		db
			.select()
			.from(requests)
			.where(or(eq(requests.senderId, profileId), eq(requests.receiverId, profileId))),
		db.select().from(contentSubscriptions).where(eq(contentSubscriptions.subscriberId, profileId)),

		db.select().from(badgesEntitlements).where(eq(badgesEntitlements.profileId, profileId)),
		db.select().from(levelsEntitlements).where(eq(levelsEntitlements.profileId, profileId)),
		db.select().from(referralCodes).where(eq(referralCodes.authorId, profileId)),
		db.select().from(referrals).where(eq(referrals.referredId, profileId)),

		// Jeton de session exclu : seules les métadonnées sont exportées
		db
			.select({
				id: sessions.id,
				ipAddress: sessions.ipAddress,
				userAgent: sessions.userAgent,
				createdAt: sessions.createdAt,
				updatedAt: sessions.updatedAt,
			})
			.from(sessions)
			.where(eq(sessions.accountId, accountId)),
		db
			.select()
			.from(accountModificationHistory)
			.where(eq(accountModificationHistory.accountId, accountId)),

		db.select().from(profileReports).where(eq(profileReports.reporterId, accountId)),
		db.select().from(postReports).where(eq(postReports.reporterId, accountId)),
		db.select().from(whisperReports).where(eq(whisperReports.reporterId, accountId)),

		// Sanctions reçues (l'émetteur n'est pas communiqué)
		db
			.select({
				id: sanctions.id,
				type: sanctions.type,
				reason: sanctions.reason,
				details: sanctions.details,
				createdAt: sanctions.createdAt,
				expiresAt: sanctions.expiresAt,
			})
			.from(sanctions)
			.where(eq(sanctions.accountId, accountId)),
	]);

	// Les autres membres ne sont exportés que par leur identifiant et leur nom public
	const otherIds = new Set<string>();

	for (const f of myFollows) {
		otherIds.add(f.followerId);
		otherIds.add(f.followingId);
	}
	for (const f of myFriendships) {
		otherIds.add(f.profileAId);
		otherIds.add(f.profileBId);
	}
	for (const b of myBlocks) otherIds.add(b.blockedId);
	for (const r of myRequests) {
		otherIds.add(r.senderId);
		otherIds.add(r.receiverId);
	}
	for (const s of mySubscriptions) otherIds.add(s.subscribedToId);
	otherIds.delete(profileId);

	const names = new Map<string, string>();

	if (otherIds.size > 0) {
		const rows = await db
			.select({ id: profiles.id, name: profiles.name })
			.from(profiles)
			.where(inArray(profiles.id, [...otherIds]));

		for (const row of rows) names.set(row.id, row.name);
	}

	const member = (id: string) => ({ id, name: names.get(id) ?? null });

	return {
		meta: {
			generatedAt: new Date().toISOString(),
			format: "ademyst-data-export",
			version: 1,
			notice:
				"Ce fichier contient vos données personnelles. Ne le partagez pas. Les fichiers médias (avatar, images) ne sont pas inclus.",
		},
		account,
		profile,
		links,
		settings: {
			appearance: appearance[0] ?? null,
			privacy: privacy[0] ?? null,
			notifications: notifications[0] ?? null,
		},
		content: {
			posts: myPosts,
			whispers: myWhispers,
			attachments: myAttachments,
			postReactions: myPostReactions,
			whisperReactions: myWhisperReactions,
		},
		relations: {
			follows: myFollows.map((f) => ({
				id: f.id,
				follower: member(f.followerId),
				following: member(f.followingId),
				createdAt: f.createdAt,
			})),
			friendships: myFriendships.map((f) => ({
				id: f.id,
				profileA: member(f.profileAId),
				profileB: member(f.profileBId),
				createdAt: f.createdAt,
			})),
			blocks: myBlocks.map((b) => ({
				id: b.id,
				blocked: member(b.blockedId),
				createdAt: b.createdAt,
			})),
			requests: myRequests.map((r) => ({
				id: r.id,
				sender: member(r.senderId),
				receiver: member(r.receiverId),
				createdAt: r.createdAt,
			})),
			contentSubscriptions: mySubscriptions.map((s) => ({
				id: s.id,
				subscribedTo: member(s.subscribedToId),
				createdAt: s.createdAt,
			})),
		},
		entitlements: {
			badges: myBadges,
			levels: myLevels,
		},
		referrals: {
			codes: myReferralCodes,
			referredBy: myReferrals,
		},
		security: {
			sessions: mySessions,
			accountHistory: history,
		},
		moderation: {
			reportsSent: {
				profiles: myProfileReports,
				posts: myPostReports,
				whispers: myWhisperReports,
			},
			sanctionsReceived: mySanctions,
		},
	};
}
