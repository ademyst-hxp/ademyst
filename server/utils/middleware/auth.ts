import type { H3Event } from "h3";

import { getIdentity, getUser } from "~~/server/utils/auth";

export const requireAuth = async (
	event: H3Event,
	ctx?: {
		min_level?: number;
	},
): Promise<Identity> => {
	const minLevel = ctx?.min_level ?? 1;

	const identity = await getIdentity(event);

	if (!identity) {
		throw createError({
			statusCode: 401,
			statusMessage: "Authentication required",
		});
	}

	const user = await getUser(identity);

	if (!user) {
		throw createError({
			statusCode: 401,
			statusMessage: "Authentication required",
		});
	}

	if (user.profile.level < minLevel) {
		throw createError({
			statusCode: 403,
			statusMessage: "Insufficient permissions",
		});
	}

	return identity;
};
