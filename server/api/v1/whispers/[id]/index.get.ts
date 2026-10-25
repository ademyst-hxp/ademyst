import { useDb } from "~~/server/db";
import { whispers } from "~~/server/db/schema/interactions";
import { eq } from "drizzle-orm";

import { retrieveCleanWhisper } from "#server/utils/converters/interactions";
import { normalizeId } from "#server/utils/normalizers/ids";

import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await getIdentity(event);
	const whisperId = normalizeId(event.context.params?.id);

	if (!whisperId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid whisper id",
		});
	}

	const [candidate] = await db
		.select()
		.from(whispers)
		.where(eq(whispers.id, whisperId))
		.limit(1);

	if (!candidate) {
		throw createError({
			statusCode: 404,
			statusMessage: "Whisper not found",
		});
	}

	const whisper = await retrieveCleanWhisper(event, identity, candidate);

	return {
		status: "ok",
		data: whisper,
	};
});
