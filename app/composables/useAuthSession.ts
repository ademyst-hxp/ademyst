import type { Profile } from "~~/shared/models/profiles";
import type { JwtPayload } from "~~/server/utils/jwt";

export interface StoredSession {
	id: string;
	accessToken: string;
	refreshToken: string;
	claims: JwtPayload | null;
	expiresAt: number | null;
	profile: Profile;
}

export interface SessionSnapshot {
	claims: JwtPayload | null;
	profile: Profile;
}

function getSessionId(profile: Profile): string {
	return profile.id;
}

function toSnapshot(session: StoredSession): SessionSnapshot {
	return {
		claims: session.claims,
		profile: session.profile,
	};
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
	const parts = token.split(".");

	if (parts.length < 2) {
		return null;
	}

	const payloadPart = parts[1];

	if (!payloadPart) {
		return null;
	}

	try {
		const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
		const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

		return JSON.parse(atob(padded)) as Record<string, unknown>;
	} catch {
		return null;
	}
}

function getRefreshTokenExpiresAt(token: string): number | null {
	const payload = decodeJwtPayload(token);
	const expiresAt = payload?.exp;

	return typeof expiresAt === "number" ? expiresAt * 1000 : null;
}

function sanitizeSessions(list: StoredSession[]): {
	sessions: StoredSession[];
	changed: boolean;
} {
	const seen = new Set<string>();
	const sessions: StoredSession[] = [];
	let changed = false;

	for (const entry of list) {
		const expiresAt =
			entry.expiresAt ?? getRefreshTokenExpiresAt(entry.refreshToken);

		if (entry.expiresAt !== expiresAt) {
			changed = true;
		}

		if (seen.has(entry.id)) {
			changed = true;
			continue;
		}

		seen.add(entry.id);

		sessions.push(
			entry.expiresAt === expiresAt ? entry : { ...entry, expiresAt },
		);
	}

	return { sessions, changed };
}

const MAX_TIMEOUT_DELAY = 2_147_483_647;

// The navbar and the page both refresh the session while rendering: they
// share one /auth/me call per app instance (keyed so that concurrent server
// renders never see each other's request).
const pendingRefreshes = new WeakMap<object, Promise<SessionSnapshot | null>>();

export const useAuthSession = () => {
	const nuxtApp = useNuxtApp();
	const { $api } = nuxtApp;

	const session = useState<SessionSnapshot | null>("session", () => null);
	const refreshedOnServer = useState<boolean>(
		"sessionRefreshedOnServer",
		() => false,
	);
	const error = useState<string | null>("sessionError", () => null);
	const loading = useState<boolean>("sessionLoading", () => false);

	const sessions = useCookie<StoredSession[]>("authSessions", {
		default: () => [],
		sameSite: "lax",
		path: "/",
	});

	const activeSessionId = useCookie<string | null>("authActiveSessionId", {
		default: () => null,
		sameSite: "lax",
		path: "/",
	});

	const accessToken = useCookie<string | null>("accessToken", {
		default: () => null,
		sameSite: "lax",
		path: "/",
	});

	let expirationTimer: ReturnType<typeof setTimeout> | null = null;

	const activeSession = computed(
		() =>
			sessions.value.find(
				(entry) => entry.id === activeSessionId.value,
			) ?? null,
	);

	const clearExpirationTimer = () => {
		if (expirationTimer) {
			clearTimeout(expirationTimer);
			expirationTimer = null;
		}
	};

	const clearActiveSession = () => {
		session.value = null;
		accessToken.value = null;
		activeSessionId.value = null;
	};

	const syncSessions = () => {
		const sanitized = sanitizeSessions(sessions.value);

		if (sanitized.changed) {
			sessions.value = sanitized.sessions;
		}

		const nextActiveSession =
			sanitized.sessions.find(
				(entry) => entry.id === activeSessionId.value,
			) ??
			sanitized.sessions[0] ??
			null;

		if (!nextActiveSession) {
			clearActiveSession();
			return null;
		}

		if (activeSessionId.value !== nextActiveSession.id) {
			activeSessionId.value = nextActiveSession.id;
		}

		if (accessToken.value !== nextActiveSession.accessToken) {
			accessToken.value = nextActiveSession.accessToken;
		}

		if (session.value?.profile.id !== nextActiveSession.profile.id) {
			session.value = toSnapshot(nextActiveSession);
		}

		return nextActiveSession;
	};

	const scheduleExpirationPrune = () => {
		clearExpirationTimer();

		const nextExpiry = sanitizeSessions(sessions.value)
			.sessions.map(
				(entry) =>
					entry.expiresAt ??
					getRefreshTokenExpiresAt(entry.refreshToken),
			)
			.filter(
				(value): value is number =>
					value !== null && value > Date.now(),
			)
			.sort((left, right) => left - right)[0];

		if (!nextExpiry) {
			return;
		}

		const delay = Math.min(
			Math.max(nextExpiry - Date.now() + 1000, 0),
			MAX_TIMEOUT_DELAY,
		);

		expirationTimer = setTimeout(() => {
			syncSessions();
			scheduleExpirationPrune();
		}, delay);
	};

	onScopeDispose(() => {
		clearExpirationTimer();
	});

	syncSessions();
	scheduleExpirationPrune();

	const storeSession = (nextSession: StoredSession) => {
		const sanitized = sanitizeSessions([nextSession, ...sessions.value]);

		sessions.value = sanitized.sessions;
		activeSessionId.value = nextSession.id;
		accessToken.value = nextSession.accessToken;
		session.value = toSnapshot(nextSession);
		scheduleExpirationPrune();
	};

	const updateActiveSession = (patch: Partial<StoredSession>) => {
		const currentSession = activeSession.value;

		if (!currentSession) {
			return null;
		}

		const nextSession = {
			...currentSession,
			...patch,
		};

		storeSession(nextSession);

		return nextSession;
	};

	const login = async (email: string, password: string) => {
		loading.value = true;
		error.value = null;

		try {
			const response = await $fetch<{
				accessToken: string;
				refreshToken: string;
				profile: Profile;
			}>("/api/v1/auth/login", {
				method: "POST",
				body: { email, password },
				credentials: "include",
			});

			storeSession({
				id: getSessionId(response.profile),
				accessToken: response.accessToken,
				refreshToken: response.refreshToken,
				claims: null,
				expiresAt: getRefreshTokenExpiresAt(response.refreshToken),
				profile: response.profile,
			});

			await refresh();

			return session.value;
		} catch (err) {
			error.value = err instanceof Error ? err.message : String(err);
			return null;
		} finally {
			loading.value = false;
		}
	};

	const fetchSession = async () => {
		loading.value = true;
		error.value = null;

		try {
			const currentSession = syncSessions();

			if (!currentSession) {
				return null;
			}

			const nextSession = await $api<SessionSnapshot>("/auth/me");

			session.value = nextSession;

			updateActiveSession({
				claims: nextSession.claims,
				profile: nextSession.profile,
				accessToken: currentSession.accessToken,
			});

			return nextSession;
		} catch {
			const currentSession = activeSession.value;

			if (currentSession) {
				sessions.value = sanitizeSessions(
					sessions.value.filter(
						(entry) => entry.id !== currentSession.id,
					),
				).sessions;
			}

			syncSessions();
			scheduleExpirationPrune();
			error.value = null;

			return null;
		} finally {
			loading.value = false;

			if (import.meta.server) {
				refreshedOnServer.value = true;
			}
		}
	};

	const refresh = () => {
		// The server already refreshed the session for this page load and
		// sent the result along with the payload.
		if (
			import.meta.client &&
			nuxtApp.isHydrating &&
			refreshedOnServer.value
		) {
			return Promise.resolve(session.value);
		}

		let pending = pendingRefreshes.get(nuxtApp);

		if (!pending) {
			pending = fetchSession().finally(() => {
				pendingRefreshes.delete(nuxtApp);
			});

			pendingRefreshes.set(nuxtApp, pending);
		}

		return pending;
	};

	const switchSession = async (sessionId: string) => {
		const targetSession = sanitizeSessions(sessions.value).sessions.find(
			(entry) => entry.id === sessionId,
		);

		if (!targetSession) {
			return null;
		}

		activeSessionId.value = targetSession.id;
		accessToken.value = targetSession.accessToken;
		session.value = toSnapshot(targetSession);

		const nextSession = await refresh();

		await refreshNuxtData();

		return nextSession;
	};

	const logout = async () => {
		loading.value = true;
		error.value = null;

		try {
			await $fetch("/api/v1/auth/logout", {
				method: "POST",
				credentials: "include",
			});

			if (activeSession.value) {
				sessions.value = sanitizeSessions(
					sessions.value.filter(
						(entry) => entry.id !== activeSession.value?.id,
					),
				).sessions;
			}

			scheduleExpirationPrune();

			const nextSession = sessions.value[0] ?? null;

			if (nextSession) {
				activeSessionId.value = nextSession.id;
				accessToken.value = nextSession.accessToken;
				session.value = toSnapshot(nextSession);
			} else {
				clearActiveSession();
			}
		} catch (err) {
			error.value = err instanceof Error ? err.message : String(err);
		} finally {
			loading.value = false;
		}
	};

	return {
		session,
		error,
		loading,
		sessions,
		activeSession,
		login,
		logout,
		refresh,
		switchSession,
	};
};
