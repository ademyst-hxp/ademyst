import { FetchError } from "ofetch";
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

	const rawApi = $fetch.create({
		baseURL: "/api/v1",
		credentials: "include",

		onRequest({ options }) {
			const token = getAuthorizationToken();

			if (!token) return;

			options.headers = new Headers(options.headers);

			options.headers.set("Authorization", `Bearer ${token}`);
		},
	});

	// Dedupe concurrent refreshes: every 401 hitting at the same time shares one call.
	let refreshPromise: Promise<boolean> | null = null;

	const refreshSession = () => {
		refreshPromise ??= (async () => {
			const currentSession = getActiveSession();

			if (!currentSession?.refreshToken) {
				accessToken.value = null;
				return false;
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

				sessions.value = sessions.value.map((entry) =>
					entry.id === currentSession.id
						? {
								...entry,
								accessToken: refresh.accessToken,
								refreshToken: refresh.refreshToken,
							}
						: entry,
				);

				return true;
			} catch {
				accessToken.value = null;
				return false;
			}
		})().finally(() => {
			refreshPromise = null;
		});

		return refreshPromise;
	};

	// $fetch.create's onResponseError can't stop the original call from
	// throwing (ofetch always re-throws after running it), so the retry has
	// to happen by wrapping the call instead of hooking into the response.
	const api = (async (request: unknown, options?: unknown) => {
		try {
			return await rawApi(request as string, options as never);
		} catch (error) {
			const is401 =
				error instanceof FetchError && error.response?.status === 401;

			if (!is401 || String(request).includes("/auth/refresh")) {
				throw error;
			}

			const refreshed = await refreshSession();

			if (!refreshed) throw error;

			return await rawApi(request as string, options as never);
		}
	}) as typeof rawApi;

	return {
		provide: {
			api,
		},
	};
});
