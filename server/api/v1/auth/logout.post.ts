import { useDb } from "~~/server/db";
import { sessions } from "~~/server/db/schema/accounts";

import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const sessionToken = getCookie(event, "refreshToken");

	if (!sessionToken) {
		throw createError({
			statusCode: 401,
			statusMessage: "Not authenticated",
		});
	}

	await db.delete(sessions).where(eq(sessions.token, sessionToken));

	deleteCookie(event, "refreshToken", {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
	});

	deleteCookie(event, "accessToken", {
		secure: true,
		sameSite: "lax",
	});

	return { ok: true };
});
