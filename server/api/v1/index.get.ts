export default defineEventHandler(() => {
	return {
		version: 1,
		status: "ok",
		timestamp: Date.now(),
		routes: {
			auth: {
				signup: "/auth/signup",
				login: "/auth/login",
				logout: "/auth/logout",
				refresh: "/auth/refresh",
				me: "/auth/me",
				sudo: {
					"reset-password": "/auth/sudo/reset-password",
					"reset-email": "/auth/sudo/reset-email",
				},
			},
		},
	};
});
