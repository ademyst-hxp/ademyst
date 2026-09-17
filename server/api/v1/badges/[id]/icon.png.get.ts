import { ObjectStorage, useS3 } from "~~/server/utils/drive";

export default defineEventHandler(async (event) => {
	const badgeId = event.context.params?.id;

	if (!badgeId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing badge ID",
		});
	}

	const s3 = useS3(event);
	const storage = new ObjectStorage(s3, 'badges');

	const badgeKey = `${badgeId}.png`;

	if (!(await storage.exists(badgeKey))) {
		throw createError({
			statusCode: 500,
			statusMessage: "Badge icon not found",
		});
	}

	const url = await storage.signedUrl(badgeKey, {
		expiresIn: 60 * 60 * 24,
	});

	return sendRedirect(event, url, 302);
});
