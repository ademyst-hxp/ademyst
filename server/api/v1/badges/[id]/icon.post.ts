import { createError, defineEventHandler, readMultipartFormData } from "h3";

import { processBadgeIcon } from "~~/server/utils/helpers/files";
import { useStorage } from "~~/server/utils/drive";

export default defineEventHandler(async (event) => {
	await requireAuth(event, {
		min_level: 8,
	});

	const badgeId = event.context.params?.id;

	if (!badgeId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing badge ID",
		});
	}

	const parts = await readMultipartFormData(event);

	const file = parts?.find((part) => part.name === "icon");

	if (!file?.data) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing icon",
		});
	}

	const contentType = file.type ?? "application/octet-stream";

	const avatar = await processBadgeIcon(file.data, contentType);

	const storage = useStorage(event, "badges");

	const key = `${badgeId}.png`;

	await storage.put(key, avatar.buffer, {
		contentType: avatar.contentType,
	});

	const url = await storage.signedUrl(key, {
		expiresIn: 60 * 60 * 24, // 1 day
	});

	return {
		url,
		width: avatar.width,
		height: avatar.height,
		size: avatar.size,
	};
});
