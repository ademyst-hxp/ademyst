export default defineNuxtRouteMiddleware(() => {
	const { session } = useAuthSession();

	if (!session.value) {
		return navigateTo("/auth/login");
	}
});
