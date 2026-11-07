import { useDb } from "~~/server/db";
import { attachments } from "~~/server/db/schema/drive";
import { eq } from "drizzle-orm";

import { convertAttachment } from "#server/utils/converters/drive";
import { canViewAttachment } from "#server/utils/helpers/attachments";
import { normalizeUUID } from "#server/utils/normalizers/ids";

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

	const [candidate] = await db
		.select()
		.from(attachments)
		.where(eq(attachments.id, attachmentId))
		.limit(1);

	if (!candidate || !(await canViewAttachment(event, identity, candidate))) {
		throw createError({
			statusCode: 404,
			statusMessage: "Attachment not found",
		});
	}

	return {
		status: "ok",
		data: convertAttachment(candidate),
	};
});
