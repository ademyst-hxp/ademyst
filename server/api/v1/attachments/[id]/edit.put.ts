import { useDb } from "#server/db";
import { attachments } from "~~/server/db/schema/drive";
import { eq } from "drizzle-orm";

import { convertAttachment } from "~~/server/utils/converters/drive";
import { requireAuth } from "~~/server/utils/middleware/auth";
import { normalizeUUID } from "~~/server/utils/normalizers/ids";
import { normalizeOptionalText } from "~~/server/utils/normalizers/interactions";
import { ATTACHMENT_ALT_TEXT_MAX_LENGTH } from "~~/shared/consts/specs";

import { createError, readBody } from "h3";
import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 2 });

	const body = await readBody(event);
	const attachmentId = normalizeUUID(event.context.params?.id);

	if (!attachmentId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid attachment id",
		});
	}

	if (!body || typeof body !== "object") {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing payload",
		});
	}

	const altText = normalizeOptionalText(body.altText);

	if (altText && altText.length > ATTACHMENT_ALT_TEXT_MAX_LENGTH) {
		throw createError({
			statusCode: 400,
			statusMessage: `Alt text exceeds maximum length of ${ATTACHMENT_ALT_TEXT_MAX_LENGTH} characters`,
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

	if (candidate.authorId !== identity.profileId) {
		throw createError({
			statusCode: 403,
			statusMessage: "You are not allowed to edit this attachment",
		});
	}

	const [edited] = await db
		.update(attachments)
		.set({ altText })
		.where(eq(attachments.id, attachmentId))
		.returning();

	if (!edited) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to edit attachment",
		});
	}

	return {
		status: "ok",
		data: convertAttachment(edited),
	};
});
