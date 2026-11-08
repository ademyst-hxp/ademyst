import { useDb } from "#server/db";
import { attachments } from "~~/server/db/schema/drive";
import { eq } from "drizzle-orm";

import { useDrive } from "~~/server/utils/drive";
import { canViewAttachment } from "~~/server/utils/helpers/attachments";
import { normalizeUUID } from "~~/server/utils/normalizers/ids";
import { ATTACHMENT_RULES } from "~~/shared/consts/specs";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await getIdentity(event);
	const attachmentId = normalizeUUID(event.context.params?.id);

	if (!attachmentId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid attachment id",
		});
	}

	const [attachment] = await db
		.select()
		.from(attachments)
		.where(eq(attachments.id, attachmentId))
		.limit(1);

	if (
		!attachment ||
		ATTACHMENT_RULES[attachment.type].external ||
		!(await canViewAttachment(event, identity, attachment))
	) {
		throw createError({
			statusCode: 404,
			statusMessage: "Attachment not found",
		});
	}

	const storage = useDrive(event, "files");

	if (!(await storage.exists(attachment.link))) {
		throw createError({
			statusCode: 404,
			statusMessage: "File not found",
		});
	}

	const url = await storage.signedUrl(attachment.link, {
		expiresIn: 60 * 60,
	});

	// Même principe que les avatars : le navigateur réutilise la redirection.
	// Uniquement posé sur la redirection pour ne jamais mettre une erreur en cache.
	setResponseHeader(event, "Cache-Control", "private, max-age=300");

	return sendRedirect(event, url, 302);
});
