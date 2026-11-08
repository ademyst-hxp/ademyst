export default defineEventHandler(async (event) => {
	createError({
		statusCode: 503,
		statusMessage: "Beam is dead now",
	});
});
