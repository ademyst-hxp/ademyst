import { createError, readBody, type H3Event } from "h3";

import { useDb } from "#server/db";
import { eq } from "drizzle-orm";

import { posts } from "#server/db/schema/interactions";
import { normalizeId } from "#server/utils/normalizers/ids";
import {
	normalizeOptionalText,
	normalizeVisibility,
} from "~~/server/utils/normalizers/interactions";

import { retrieveCleanPost } from "~~/server/utils/converters/interactions";
import { requireAuth } from "~~/server/utils/middleware/auth";

import { PostVisibility } from "~~/shared/models/interactions";

const validatePayload = (
	payload: any,
	specs: {
		max_length: number;
	},
): { content: string | undefined; visibility: PostVisibility | undefined } => {
	if (!payload) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing payload",
		});
	}

	const content = normalizeOptionalText(payload?.content) || undefined;
	const visibility = normalizeVisibility(payload?.visibility) || undefined;

	if (content && content.length > specs.max_length) {
		throw createError({
			statusCode: 400,
			statusMessage: `Post content exceeds maximum length of ${specs.max_length} characters`,
		});
	}

	return { content, visibility };
};

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 2 });
	const user = await getUser(event, identity);

	if (!user) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

	const body = await readBody(event);
	const id = normalizeId(event.context.params?.id);

	if (!id) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid post id",
		});
	}

	const specs = {
		max_length:
			user.profile.level >= 5
				? 5000
				: user.profile.level >= 4
					? 2000
					: 1000,
	};

	const { content, visibility } = validatePayload(body, specs);

	let updatedAt = undefined;
	if (content) updatedAt = new Date();

	const [editedPost] = await db
		.update(posts)
		.set({
			content,
			visibility,
			updatedAt,
		})
		.where(eq(posts.id, id))
		.returning();

	if (!editedPost) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to edit post",
		});
	}

	const post = await retrieveCleanPost(event, identity, editedPost);

	return {
		status: "ok",
		data: post,
	};
});
