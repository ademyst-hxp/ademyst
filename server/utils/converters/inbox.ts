import { useDb } from "#server/db";
import {
	announcements,
	notifications,
} from "#server/db/schema/inbox";
import { badgesEntitlements, levelsEntitlements } from "#server/db/schema/entitlements";
import { posts, whispers } from "#server/db/schema/interactions";
import { profiles } from "#server/db/schema/profiles";
import { postReports, profileReports, whisperReports } from "#server/db/schema/reports";
import { badges, levels } from "#server/db/schema/shop";
import { eq } from "drizzle-orm";

import { getNotificationCategory } from "~~/shared/consts/notifications";
import type { Notification } from "~~/shared/models/inbox";
import { retrieveCleanPost, retrieveCleanWhisper } from "#server/utils/converters/interactions";
import { retrieveCleanProfile } from "#server/utils/converters/profiles";
import { retrieveCleanPostReport, retrieveCleanProfileReport, retrieveCleanWhisperReport } from "#server/utils/converters/reports";
import { retrieveCleanBadge, retrieveCleanLevel } from "#server/utils/converters/shop";
import type { H3Event } from "h3";

type DbNotification = typeof notifications.$inferSelect;

const first = async <T>(query: PromiseLike<T[]>): Promise<T | null> =>
	(await query)[0] ?? null;

export async function retrieveCleanNotifications(
	event: H3Event,
	identity: Identity,
	rows: DbNotification[],
): Promise<Notification[]> {
	const db = useDb(event);

	return Promise.all(rows.map(async (row) => {
		const base = {
			id: row.id,
			type: row.type,
			category: getNotificationCategory(row.type),
			read: row.readAt !== null,
			readAt: row.readAt,
			createdAt: row.createdAt,
			data: row.data,
		};

		switch (row.type) {
			case "content.post":
			case "interaction.milestone":
			case "interaction.reply": {
				const post = row.postId
					? await first(db.select().from(posts).where(eq(posts.id, row.postId)))
					: null;
				if (!post) return { ...base, subject: { kind: "post", post: null } } as Notification;
				const cleanPost = await retrieveCleanPost(event, identity, post);
				const actor = row.actorId
					? await first(db.select().from(profiles).where(eq(profiles.id, row.actorId)))
					: null;
				const cleanActor = actor
					? await retrieveCleanProfile(event, identity, actor)
					: null;
				if (row.type === "interaction.reply") {
					const parent = post.parentId
						? await first(db.select().from(posts).where(eq(posts.id, post.parentId)))
						: null;
					return {
						...base,
						actor: cleanActor,
						reply: cleanPost,
						parent: parent ? await retrieveCleanPost(event, identity, parent) : null,
					} as Notification;
				}
				if (row.type === "content.post") {
					return { ...base, actor: cleanActor, post: cleanPost } as Notification;
				}
				return {
					...base,
					...(cleanActor ? { actor: cleanActor } : {}),
					subject: { kind: "post", post: cleanPost },
				} as Notification;
			}
			case "content.whisper": {
				const whisper = row.whisperId
					? await first(db.select().from(whispers).where(eq(whispers.id, row.whisperId)))
					: null;
				if (!whisper) return { ...base, subject: { kind: "whisper", whisper: null } } as Notification;
				const actor = row.actorId
					? await first(db.select().from(profiles).where(eq(profiles.id, row.actorId)))
					: null;
				const cleanWhisper = await retrieveCleanWhisper(event, identity, whisper);
				const cleanActor = actor ? await retrieveCleanProfile(event, identity, actor) : null;
				return row.type === "content.whisper"
					? { ...base, actor: cleanActor, whisper: cleanWhisper } as Notification
					: { ...base, ...(cleanActor ? { actor: cleanActor } : {}), subject: { kind: "whisper", whisper: cleanWhisper } } as Notification;
			}
			case "interaction.reaction": {
				if (row.postId) {
					const post = await first(db.select().from(posts).where(eq(posts.id, row.postId)));
					const actor = row.actorId ? await first(db.select().from(profiles).where(eq(profiles.id, row.actorId))) : null;
					return {
						...base,
						...(actor ? { actor: await retrieveCleanProfile(event, identity, actor) } : {}),
						subject: { kind: "post", post: post ? await retrieveCleanPost(event, identity, post) : null },
					} as Notification;
				}
				const whisper = row.whisperId ? await first(db.select().from(whispers).where(eq(whispers.id, row.whisperId))) : null;
				const actor = row.actorId ? await first(db.select().from(profiles).where(eq(profiles.id, row.actorId))) : null;
				return {
					...base,
					...(actor ? { actor: await retrieveCleanProfile(event, identity, actor) } : {}),
					subject: { kind: "whisper", whisper: whisper ? await retrieveCleanWhisper(event, identity, whisper) : null },
				} as Notification;
			}
			case "relation.follower":
			case "relation.request": {
				const actor = row.actorId
					? await first(db.select().from(profiles).where(eq(profiles.id, row.actorId)))
					: null;
				return { ...base, actor: actor ? await retrieveCleanProfile(event, identity, actor) : null } as Notification;
			}
			case "report.received":
			case "report.rejected":
			case "report.actioned":
			case "report.downgraded": {
				const report = row.profileReportId
					? await first(db.select().from(profileReports).where(eq(profileReports.id, row.profileReportId))).then((r) => r ? retrieveCleanProfileReport(event, identity, r) : null)
					: row.postReportId
						? await first(db.select().from(postReports).where(eq(postReports.id, row.postReportId))).then((r) => r ? retrieveCleanPostReport(event, identity, r) : null)
						: await first(db.select().from(whisperReports).where(eq(whisperReports.id, row.whisperReportId!))).then((r) => r ? retrieveCleanWhisperReport(event, identity, r) : null);
				return { ...base, report: report ? { id: report.id, target: report } : null } as Notification;
			}
			case "sanction.issued":
			case "sanction.updated":
			case "sanction.lifted":
			case "sanction.expired":
				return { ...base, sanctionId: row.sanctionId } as Notification;
			case "badge.granted":
			case "badge.expired":
			case "badge.revoked": {
				const entitlement = row.badgeEntitlementId
					? await first(db.select().from(badgesEntitlements).where(eq(badgesEntitlements.id, row.badgeEntitlementId)))
					: null;
				const badge = entitlement ? await first(db.select().from(badges).where(eq(badges.id, entitlement.badgeId))) : null;
				return { ...base, badge: badge ? await retrieveCleanBadge(event, badge) : null } as Notification;
			}
			case "level.granted":
			case "level.expired":
			case "level.revoked": {
				const entitlement = row.levelEntitlementId
					? await first(db.select().from(levelsEntitlements).where(eq(levelsEntitlements.id, row.levelEntitlementId)))
					: null;
				const level = entitlement ? await first(db.select().from(levels).where(eq(levels.id, entitlement.levelId))) : null;
				const badgeId =
					"badgeId" in row.data ? row.data.badgeId : null;
				const badge = badgeId
					? await first(db.select().from(badges).where(eq(badges.id, badgeId)))
					: null;
				return {
					...base,
					level: level ? await retrieveCleanLevel(event, level) : null,
					badge: badge ? await retrieveCleanBadge(event, badge) : null,
				} as Notification;
			}
			case "announcement.alert":
			case "announcement.news": {
				const announcement = row.announcementId
					? await first(db.select().from(announcements).where(eq(announcements.id, row.announcementId)))
					: null;
				return { ...base, announcement } as Notification;
			}
			default:
				return base as Notification;
		}
	}));
}
