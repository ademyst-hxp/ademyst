import { createError, readBody } from "h3";

import { useDb } from "#server/db";
import { whispers } from "#server/db/schema/interactions";
import { generateHexId } from "#server/utils/ids";

import {
	normalizeOptionalText,
	normalizeVisibility,
} from "~~/server/utils/normalizers/interactions";

import { retrieveCleanWhisper } from "~~/server/utils/converters/interactions";
import { requireAuth } from "~~/server/utils/middleware/auth";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 2 });

	const body = await readBody(event);
	const content = normalizeOptionalText(body?.content) ?? "";
	const visibility = normalizeVisibility(body?.visibility) ?? "everyone";
	const id = generateHexId();

	const [createdWhisper] = await db
		.insert(whispers)
		.values({
			id,
			profileId: identity.profileId,
			content,
			visibility,
		})
		.returning();

	if (!createdWhisper) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to create whisper",
		});
	}

	const whisper = await retrieveCleanWhisper(event, identity, createdWhisper);

	return {
		status: "ok",
		data: whisper,
	};
});
