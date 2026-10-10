import { eq } from "drizzle-orm/sql/expressions/conditions";

import { useDb } from "#server/db";
import { badges } from "~~/server/db/schema/shop";

import type { ItemRarity } from "~~/shared/models/shop";

const validatePayload = (
	payload: any,
): {
	name?: string;
	description?: string;
	color?: string;
	rarity?: ItemRarity;
} => {
	if (typeof payload !== "object" || payload === null) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid payload",
		});
	}

	const { name, description, color, rarity } = payload;

	if (
		(name !== undefined && typeof name !== "string") ||
		(description !== undefined && typeof description !== "string") ||
		(color !== undefined && typeof color !== "string") ||
		(rarity !== undefined && typeof rarity !== "string")
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid payload",
		});
	}

	const trimmedName = name?.trim();

	if (trimmedName && !/^[a-zA-Z0-9_]{3,16}$/.test(trimmedName)) {
		throw createError({
			statusCode: 400,
			statusMessage:
				"Invalid username. It must be 3-16 characters long and can only contain letters, numbers, and underscores.",
		});
	}

	if (description && description.trim().length > 256) {
		throw createError({
			statusCode: 400,
			statusMessage:
				"Description is too long. It must be 256 characters or less.",
		});
	}

	if (color && color.trim().length !== 7) {
		throw createError({
			statusCode: 400,
			statusMessage: "Color must be 7 characters long.",
		});
	}

	if (
		rarity &&
		!["common", "uncommon", "rare", "epic", "legendary"].includes(rarity)
	) {
		throw createError({
			statusCode: 400,
			statusMessage:
				"Invalid rarity. It must be one of: common, uncommon, rare, epic, legendary.",
		});
	}

	return {
		name: name?.trim(),
		description: description?.trim(),
		color: color?.trim(),
		rarity: rarity as ItemRarity,
	};
};

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const badgeId = event.context.params?.id;

	const entries = await readBody(event);
	const payload = validatePayload(entries);

	await requireAuth(event, {
		min_level: 8,
	});

	if (!badgeId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing badge ID",
		});
	}

	const [badge] = await db
		.select()
		.from(badges)
		.where(eq(badges.id, badgeId))
		.limit(1);

	if (!badge) {
		throw createError({
			statusCode: 404,
			statusMessage: "Badge not found",
		});
	}

	await db.update(badges).set(payload).where(eq(badges.id, badge.id));

	return {
		status: "ok",
	};
});
