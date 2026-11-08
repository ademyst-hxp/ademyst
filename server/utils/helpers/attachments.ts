import { useDb } from "#server/db";
import { attachments } from "~~/server/db/schema/drive";
import { profiles } from "~~/server/db/schema/profiles";
import { eq } from "drizzle-orm";

import { useDrive } from "~~/server/utils/drive";
import {
	canAccessEntity,
	getPrivacySettings,
	getRelationshipStatus,
} from "~~/server/utils/helpers/privacy";
import {
	ATTACHMENT_LINK_MAX_LENGTH,
	ATTACHMENT_RULES,
} from "~~/shared/consts/specs";
import { getAttachmentLimit, isMediaRatio } from "~~/shared/utils/attachments";

import type { Attachment as DbAttachment } from "~~/server/db/schema/drive";
import type { AttachmentType, MediaRatio } from "~~/shared/models/drive";
import type { getPostSpecs } from "~~/shared/utils/interactions";
import type { H3Event } from "h3";

export function normalizeAttachmentType(value: unknown): AttachmentType | null {
	if (typeof value !== "string") return null;

	const type = value.trim() as AttachmentType;

	return type in ATTACHMENT_RULES ? type : null;
}

export function normalizeMediaRatio(value: unknown): MediaRatio | null {
	return isMediaRatio(value) ? value : null;
}

export function normalizeExternalUrl(value: unknown): string {
	if (typeof value !== "string" || !value.trim()) {
		throw createError({
			statusCode: 400,
			statusMessage: "URL cannot be empty",
		});
	}

	const url = value.trim();

	if (url.length > ATTACHMENT_LINK_MAX_LENGTH) {
		throw createError({
			statusCode: 400,
			statusMessage: `URL exceeds maximum length of ${ATTACHMENT_LINK_MAX_LENGTH} characters`,
		});
	}

	let parsedUrl: URL;

	try {
		parsedUrl = new URL(url);
	} catch {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid URL format",
		});
	}

	if (!["http:", "https:"].includes(parsedUrl.protocol)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid URL protocol",
		});
	}

	return url;
}

// Clé d'un fichier hébergé dans le bucket "files"
export const buildAttachmentKey = (id: string, extension = "webp"): string =>
	`/attachments/${id}.${extension}`;

// Lève une 403 si ajouter `incoming` Attachment(s) de ce type dépasse la limite.
export function assertAttachmentSlots(
	type: AttachmentType,
	used: number,
	specs: ReturnType<typeof getPostSpecs>,
	incoming = 1,
) {
	if (used + incoming > getAttachmentLimit(type, specs)) {
		throw createError({
			statusCode: 403,
			statusMessage: `Attachment limit reached for type "${type}"`,
		});
	}
}

// Un Attachment orphelin (sans publication) n'est visible que par son auteur.
export async function canViewAttachment(
	event: H3Event,
	identity: Identity | null | undefined,
	attachment: DbAttachment,
): Promise<boolean> {
	if (identity && identity.profileId === attachment.authorId) {
		return true;
	}

	if (!attachment.postId) {
		return false;
	}

	const db = useDb(event);

	const [author] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, attachment.authorId))
		.limit(1);

	if (!author) {
		return false;
	}

	const relationship = await getRelationshipStatus(event, identity, author);
	const privacy = await getPrivacySettings(event, author);

	return canAccessEntity(privacy, relationship, attachment.visibility);
}

// Supprime du bucket les fichiers hébergés (les GIFs et liens n'en ont pas).
export async function deleteAttachmentFiles(
	event: H3Event,
	rows: DbAttachment[],
) {
	const hosted = rows.filter((row) => !ATTACHMENT_RULES[row.type].external);

	if (hosted.length === 0) return;

	const storage = useDrive(event, "files");

	await Promise.all(hosted.map((row) => storage.delete(row.link)));
}
