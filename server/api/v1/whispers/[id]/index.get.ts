import { useDb } from "~~/server/db";
import { eq } from "drizzle-orm";

import { whispers } from "~~/server/db/schema/interactions";

import { retrieveCleanWhisper } from "#server/utils/converters/interactions";

import { normalizeId } from "#server/utils/normalizers/ids";
import { getInteractionStatus } from "~~/server/utils/helpers/interaction";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await getIdentity(event);
	const whisperId = normalizeId(event.context.params?.id);

	if (!whisperId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid whisper id",
		});
	}

	const [candidate] = await db.select().from(whispers).where(eq(whispers.id, whisperId)).limit(1);

	if (!candidate) {
		throw createError({
			statusCode: 404,
			statusMessage: "Whisper not found",
		});
	}

	const whisper = retrieveCleanWhisper(event, identity, candidate);

	return {
		status: "ok",
		data: whisper,
	};
});
