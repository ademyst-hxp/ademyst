import { useDb } from "#server/db";
import { hashtags } from "#server/db/schema/interactions";
import { eq } from "drizzle-orm/sql/expressions/conditions";

const validatePayload = (
	payload: any,
): { NFE?: boolean; irrelevant?: boolean; suicide?: boolean } => {
	if (typeof payload !== "object" || payload === null) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid payload",
		});
	}

	if (typeof payload.NFE !== "boolean" && payload.NFE !== undefined) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid payload",
		});
	}

	if (typeof payload.irrelevant !== "boolean" && payload.irrelevant !== undefined) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid payload",
		});
	}

	if (typeof payload.suicide !== "boolean" && payload.suicide !== undefined) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid payload",
		});
	}

	return {
		NFE: payload.NFE,
		irrelevant: payload.irrelevant,
		suicide: payload.suicide,
	};
};

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 7 });

	const tag = event.context.params?.tag;

	const body = await readBody(event);

	const payload = validatePayload(body)

	if (!tag) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing tag",
		});
	}

	let [hashtag] = await db
		.select()
		.from(hashtags)
		.where(eq(hashtags.tag, tag))
		.limit(1);

	if (!hashtag) {
		[hashtag] = await db
			.insert(hashtags)
			.values({
				tag,
				NFE: payload.NFE,
				irrelevant: payload.irrelevant,
				suicide: payload.suicide,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		if (hashtag) {
			return {
				status: "ok",
				hashtag: retrieveCleanHashtag(event, identity, hashtag),
			};
		} else {
			throw createError({
				statusCode: 500,
				statusMessage: "Failed to create hashtag",
			});
		}
	}

	[hashtag] = await db
		.update(hashtags)
		.set({
			NFE: payload.NFE ?? hashtag.NFE,
			irrelevant: payload.irrelevant ?? hashtag.irrelevant,
			suicide: payload.suicide ?? hashtag.suicide,
			updatedAt: new Date(),
		})
		.where(eq(hashtags.tag, tag))
		.returning();

	if (!hashtag) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to update hashtag",
		});
	}

	return {
		status: "ok",
		hashtag: retrieveCleanHashtag(event, identity, hashtag),
	};
});
