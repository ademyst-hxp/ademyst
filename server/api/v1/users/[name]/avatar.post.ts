import { createError, defineEventHandler, readMultipartFormData } from "h3";

import { processAvatar } from "~~/server/utils/helpers/files";
import { useDrive } from "~~/server/utils/drive";

export default defineEventHandler(async (event) => {
	const identity = await requireAuth(event);

	const parts = await readMultipartFormData(event);

	const file = parts?.find((part) => part.name === "avatar");

	if (!file?.data) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing avatar",
		});
	}

	const contentType = file.type ?? "application/octet-stream";

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

	const avatar = await processAvatar(
		file.data,
		contentType,
		cloudflare.env.IMAGES,
	);

	const storage = useDrive(event, "avatars");

	const userId = identity.profileId;

	const key = `${userId}.webp`;

	await storage.put(key, avatar.buffer, {
		contentType: avatar.contentType,
	});

	const url = await storage.signedUrl(key, {
		expiresIn: 60 * 60,
	});

	return {
		url,
		width: avatar.width,
		height: avatar.height,
		size: avatar.size,
	};
});
