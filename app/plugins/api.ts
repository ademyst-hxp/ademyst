import type { StoredSession } from "~/composables/useAuthSession";

export default defineNuxtPlugin(() => {
	const accessToken = useCookie<string | null>("accessToken");
	const sessions = useCookie<StoredSession[]>("authSessions", {
		default: () => [],
	});
	const activeSessionId = useCookie<string | null>("authActiveSessionId", {
		default: () => null,
	});

	const getActiveSession = () =>
		sessions.value.find((entry) => entry.id === activeSessionId.value) ??
		null;
	const getAuthorizationToken = () =>
		accessToken.value ?? getActiveSession()?.accessToken ?? null;

	const api = $fetch.create({
		baseURL: "/api/v1",
		credentials: "include",

		onRequest({ options }) {
			const token = getAuthorizationToken();

			if (!token) return;

			options.headers = new Headers(options.headers);

			options.headers.set("Authorization", `Bearer ${token}`);
		},

		async onResponseError({ response, request, options }) {
			if (response.status !== 401) return;

			if (String(request).includes("/auth/refresh")) {
				accessToken.value = null;
				return;
			}

			const currentSession = getActiveSession();

			if (!currentSession?.refreshToken) {
				accessToken.value = null;
				return;
			}

			try {
				const refresh = await $fetch<{
					accessToken: string;
					refreshToken: string;
				}>("/api/v1/auth/refresh", {
					method: "POST",
					body: {
						refreshToken: currentSession.refreshToken,
					},
					credentials: "include",
				});

				accessToken.value = refresh.accessToken;
				currentSession.accessToken = refresh.accessToken;

				sessions.value = sessions.value.map((entry) =>
					entry.id === currentSession.id
						? {
								...entry,
								accessToken: refresh.accessToken,
								refreshToken: refresh.refreshToken,
							}
						: entry,
				);

				const retryOptions = {
					...options,
					headers: new Headers(options.headers),
				};

				(retryOptions.headers as Headers).set(
					"Authorization",
					`Bearer ${refresh.accessToken}`,
				);

				return await $fetch(request as string, retryOptions as any);
			} catch {
				accessToken.value = null;
				throw response;
			}
		},
	});

	return {
		provide: {
			api,
		},
	};
});
