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

	const avatar = await processAvatar(file.data, contentType);

	const drive = useDrive(event);

	const userId = identity.profileId;

	const key = `avatars/${userId}.webp`;

	await drive.put(key, avatar.buffer, {
		contentType: avatar.contentType,
		cacheControl: "public, max-age=31536000, immutable",
	});

	const url = await drive.signedUrl(key, {
		expiresIn: 60*60, // 1 hour
	});

	return {
		url,
		width: avatar.width,
		height: avatar.height,
		size: avatar.size,
	};
});
