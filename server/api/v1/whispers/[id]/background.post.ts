import { useDrive } from "~~/server/utils/drive";
import { processWhisperBackground } from "~~/server/utils/helpers/files";

import { createError, defineEventHandler, readMultipartFormData } from "h3";

import { useDb } from "#server/db";
import { and, eq } from "drizzle-orm";
import { whispers } from "~~/server/db/schema/interactions";

const validateId = (id: string | undefined): id is string => {
	if (!id) {
		return false;
	}

	if (typeof id !== "string") {
		return false;
	}

	if (!/^[a-fA-F0-9]{10}$/.test(id)) {
		return false;
	}

	return true;
}

export default defineEventHandler(async (event) => {
	const db = useDb(event);
	const id = event.context.params?.id;

	if (!validateId(id)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid ID",
		});
	}

	const identity = await requireAuth(event);

	const parts = await readMultipartFormData(event);

	const file = parts?.find((part) => part.name === "background");

	if (!file?.data) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing background",
		});
	}

	const contentType = file.type ?? "application/octet-stream";

	const whisper = await db
		.select()
		.from(whispers)
		.where(
			and(
				eq(whispers.id, id),
				eq(whispers.profileId, identity.profileId),
			),
		)

	if (!whisper) {
		throw createError({
			statusCode: 404,
			statusMessage: "Whisper not found",
		});
	}

	console.log({
		filename: file?.filename,
		type: file?.type,
		size: file?.data?.length,
		firstBytes: file?.data ? Array.from(file.data.slice(0, 16)) : null,
	});

	const cloudflare = event.context.cloudflare;

	if (!cloudflare?.env?.IMAGES) {
		throw createError({
			statusCode: 500,
			statusMessage: "Cloudflare Images binding is not configured",
		});
	}

	const background = await processWhisperBackground(
		file.data,
		contentType,
		cloudflare.env.IMAGES,
	);

	const storage = useDrive(event, "files");

	const userId = identity.profileId;

	const key = `/whispers/${userId}.webp`;

	await storage.put(key, background.buffer, {
		contentType: background.contentType,
	});

	const url = await storage.signedUrl(key, {
		expiresIn: 60 * 60,
	});

	return {
		url,
		width: background.width,
		height: background.height,
		size: background.size,
	};
});
