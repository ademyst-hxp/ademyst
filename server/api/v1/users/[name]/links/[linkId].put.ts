import { useDb } from "~~/server/db";
import { eq } from "drizzle-orm";

import { profiles, profileLinks } from "~~/server/db/schema/profiles";

import { domains } from "~~/shared/consts/links";

const validatePayload = (
	payload: any,
): {
	name: string;
	type: string;
	url?: string;
	resourceId?: string;
	resourceName?: string;
} => {
	if (typeof payload !== "object" || payload === null) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid payload",
		});
	}

	const { name, type, url, resourceId, resourceName } = payload;

	if (
		(name && typeof name !== "string") ||
		typeof type !== "string" ||
		typeof url !== "string" ||
		typeof resourceId !== "string" ||
		typeof resourceName !== "string"
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid payload",
		});
	}

	const trimmedType = type?.trim();
	const trimmedUrl = url?.trim();
	const trimmedResourceId = resourceId?.trim();
	const trimmedResourceName = resourceName?.trim();

	if (!trimmedType) {
		throw createError({
			statusCode: 400,
			statusMessage: "All fields cannot be empty",
		});
	}

	if (!trimmedUrl && !trimmedResourceId && !trimmedResourceName) {
		throw createError({
			statusCode: 400,
			statusMessage:
				"At least one of url, resourceId or resourceName must be provided",
		});
	}

	if (trimmedUrl && !/^https?:\/\/.+/.test(trimmedUrl)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid URL format",
		});
	}

	let _name: string | undefined = name?.trim();

	if (trimmedUrl && /^https?:\/\/.+/.test(trimmedUrl)) {
		_name = new URL(trimmedUrl).hostname.replace(/^www\./, "");

		if (Object.keys(domains).includes(name)) {
			_name = domains[name as keyof typeof domains]!.title;
		}
	}

	if (!_name) {
		throw createError({
			statusCode: 400,
			statusMessage: "Name cannot be empty",
		});
	}

	return {
		name: _name,
		type: trimmedType,
		url: trimmedUrl,
		resourceId: trimmedResourceId,
		resourceName: trimmedResourceName,
	};
};

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await getIdentity(event);

	const entries = await readBody(event);
	const payload = validatePayload(entries);

	const name = event.context.params?.name;
	const id = event.context.params?.linkId;

	if (!name) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing username",
		});
	}

	if (!id) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing link ID",
		});
	}

	const [profile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.name, name))
		.limit(1);

	if (!profile) {
		throw createError({
			statusCode: 404,
			statusMessage: "User not found",
		});
	}

	if (profile.id !== identity?.profileId) {
		throw createError({
			statusCode: 403,
			statusMessage:
				"You are not authorized to add links to this profile",
		});
	}

	const [existingLink] = await db
		.select()
		.from(profileLinks)
		.where(eq(profileLinks.id, id))
		.limit(1);

	if (!existingLink) {
		throw createError({
			statusCode: 404,
			statusMessage: "Link not found",
		});
	}

	const [updatedLink] = await db
		.update(profileLinks)
		.set({
			name: payload.name,
			type: payload.type,
			url: payload.url,
			resourceId: payload.resourceId,
			resourceName: payload.resourceName,
		})
		.where(eq(profileLinks.id, id))
		.returning();

	if (!updatedLink) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to update link",
		});
	}

	const { profileId: _, ...linkWithoutProfileId } = updatedLink;

	return {
		status: "ok",
		link: linkWithoutProfileId,
	};
});
