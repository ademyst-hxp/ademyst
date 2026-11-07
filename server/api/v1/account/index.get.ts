export default defineEventHandler(async (event) => {
	const identity = await requireAuth(event);

	return {
		status: "ok",
		data: convertAccount(identity.account),
	};
});
