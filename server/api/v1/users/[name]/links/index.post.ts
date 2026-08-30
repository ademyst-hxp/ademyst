import type { H3Event } from "h3";

import { createDb } from "~~/server/db";
import { eq } from "drizzle-orm";

import { profiles, profileLinks } from "~~/server/db/schema/profiles";
import { domains } from "~~/shared/consts/links";

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

	const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");

	const domain = domains[hostname];

	let type = "website";
	let name = hostname;
	let resourceId: string | undefined;
	let resourceName: string | undefined;

	if (domain) {
		type = domain.name;
		name = domain.title;

		const match = domain.pattern.exec(parsedUrl.pathname);
		const resource = match?.[1];

		if (resource) {
			if (domain.slugType === "id") {
				resourceId = resource;
			} else {
				resourceName = resource;
			}
		}
	}

	return {
		name,
		type,
		url,
		resourceId,
		resourceName,
	};
};

export default defineEventHandler(async (event: H3Event) => {
	const { db, client } = createDb();

	try {
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

		const { profileId: _, ...linkWithoutProfileId } = link;

		return {
			status: "ok",
			link: linkWithoutProfileId,
		};
	} finally {
		await client.end();
	}
});
