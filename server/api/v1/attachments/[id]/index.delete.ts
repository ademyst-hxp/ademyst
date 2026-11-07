import { useDb } from "~~/server/db";
import { attachments } from "~~/server/db/schema/drive";
import { eq } from "drizzle-orm";

import { deleteAttachmentFiles } from "#server/utils/helpers/attachments";
import { normalizeUUID } from "#server/utils/normalizers/ids";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event);

	const attachmentId = normalizeUUID(event.context.params?.id);

	if (!attachmentId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid attachment id",
		});
	}

	const [candidate] = await db
		.select()
		.from(attachments)
		.where(eq(attachments.id, attachmentId))
		.limit(1);

	if (!candidate) {
		throw createError({
			statusCode: 404,
			statusMessage: "Attachment not found",
		});
	}

	if (
		!(
			candidate.authorId === identity.profileId ||
			identity.profile.level >= 7
		)
	) {
		throw createError({
			statusCode: 403,
			statusMessage: "You are not authorized to delete this attachment",
		});
	}

	await db.delete(attachments).where(eq(attachments.id, attachmentId));
	await deleteAttachmentFiles(event, [candidate]);

	return {
		status: "ok",
	};
});
