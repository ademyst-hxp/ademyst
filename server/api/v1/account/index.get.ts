export default defineEventHandler(async (event) => {
	const identity = await requireAuth(event);
	const user = await getUser(event, identity);

	if (!user) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

	return {
		status: "ok",
		data: convertAccount(user.account),
	};
});
