export default defineNuxtRouteMiddleware(() => {
	const { session } = useAuthSession();

	if (!session.value) {
		return navigateTo("/auth/login");
	}

	if ((session.value.profile.level ?? 0) < 7) {
		return createError({
			statusCode: 403,
			statusMessage: `You do not have permission to access this page`,
		});
	}
});
