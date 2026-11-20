import { useDb } from "~~/server/db";
import { profileLinks, profiles } from "~~/server/db/schema/profiles";
import { eq } from "drizzle-orm";

import type { H3Event } from "h3";

import { triggerQuests } from "~~/server/jobs/campaigns/christmas";

import { resolveProfileLink } from "~~/shared/consts/links";

type LinkPayload = {
	name: string;
	type: string;
	url: string;
	resourceId?: string;
	resourceName?: string;
};

const validatePayload = (payload: unknown): LinkPayload => {
	if (typeof payload !== "string") {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid payload",
		});
	}

	const url = payload.trim();

	if (!url) {
		throw createError({
			statusCode: 400,
			statusMessage: "URL cannot be empty",
		});
	}

	let parsedUrl: URL;

	try {
		parsedUrl = new URL(url);
	} catch {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid URL format",
		});
	}

	if (!["http:", "https:"].includes(parsedUrl.protocol)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid URL protocol",
		});
	}

	// Détection automatique : hors registre, le domaine remplace le slug.
	const info = resolveProfileLink(url);

	if (!info) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid URL format",
		});
	}

	return { ...info, url };
};

export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await getIdentity(event);

	const url = await readBody<string>(event);
	const payload = validatePayload(url);

	const username = event.context.params?.name;

	if (!username) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing username",
		});
	}

	if (!identity) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

	const [profile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.name, username))
		.limit(1);

	if (!profile) {
		throw createError({
			statusCode: 404,
			statusMessage: "User not found",
		});
	}

	if (profile.id !== identity.profileId) {
		throw createError({
			statusCode: 403,
			statusMessage:
				"You are not authorized to add links to this profile",
		});
	}

	const [link] = await db
		.insert(profileLinks)
		.values({
			profileId: profile.id,
			name: payload.name,
			type: payload.type,
			url: payload.url,
			resourceId: payload.resourceId,
			resourceName: payload.resourceName,
		})
		.returning();

	if (!link) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to add link",
		});
	}

	// Quête de Noël : mettre à jour un élément de son profil (6)
	await triggerQuests(event, profile.id, [6]);

	const { profileId: _, ...linkWithoutProfileId } = link;

	return {
		status: "ok",
		link: linkWithoutProfileId,
	};
});
