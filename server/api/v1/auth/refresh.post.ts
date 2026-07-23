import { getCookie, setCookie, readBody } from "h3";
import { eq } from "drizzle-orm";

import { db } from "#server/db";
import { sessions } from "#server/db/schema/accounts";

import {
	verifyRefreshToken,
	signRefreshToken,
	signAccessToken,
} from "#server/utils/jwt";

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const refreshToken =
		typeof body?.refreshToken === "string" &&
		body.refreshToken.trim().length
			? body.refreshToken.trim()
			: getCookie(event, "refreshToken");

	if (!refreshToken) {
		throw createError({
			statusCode: 401,
			statusMessage: "Missing refresh token",
		});
	}

	let payload;

	try {
		payload = await verifyRefreshToken(refreshToken);
	} catch {
		throw createError({
			statusCode: 401,
			statusMessage: "Invalid refresh token",
		});
	}

	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.token, refreshToken))
		.limit(1);

	if (!session) {
		throw createError({
			statusCode: 401,
			statusMessage: "Session revoked",
		});
	}

	const newRefreshToken = await signRefreshToken({
		sub: payload.sub,
		profileId: payload.profileId,
	});

	const accessToken = await signAccessToken({
		sub: payload.sub,
		profileId: payload.profileId,
	});

	await db
		.update(sessions)
		.set({
			token: newRefreshToken,
		})
		.where(eq(sessions.id, session.id));

	setCookie(event, "refreshToken", newRefreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 30,
	});

	setCookie(event, "accessToken", accessToken, {
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 15,
	});

	return {
		accessToken,
		refreshToken: newRefreshToken,
	};
});
