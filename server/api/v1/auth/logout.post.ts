export default defineEventHandler(async (event) => {
	const sessionToken = getCookie(event, "refreshToken");

	if (!sessionToken) {
		throw createError({
			statusCode: 401,
			statusMessage: "Not authenticated",
		});
	}

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
