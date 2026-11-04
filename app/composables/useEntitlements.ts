import type {
	BadgeEntitlement,
	LevelEntitlement,
} from "~~/shared/models/entitlements";
import type { Badge } from "~~/shared/models/shop";

export type EntitlementForm = {
	name?: string;
	reason?: string;
	// Value of a datetime-local input (local time) or an ISO date.
	expiresAt?: string | null;
};

export type EntitlementKind = "levels" | "badges";

type Page<K extends string, T> = Record<K, T[]> & {
	status: "ok";
	next: number;
	hasNext: boolean;
};

// Page size (the API caps it at 100) and safety bound on the number of pages.
const PAGE_SIZE = 100;
const MAX_PAGES = 10;

const buildBody = (form: EntitlementForm) => ({
	name: form.name || undefined,
	reason: form.reason || undefined,
	expiresAt: form.expiresAt
		? new Date(form.expiresAt).toISOString()
		: undefined,
});

export const useEntitlements = () => {
	const { $api } = useNuxtApp();

	const fetchAll = async <K extends string, T>(
		path: string,
		key: K,
		profileId: string,
	): Promise<T[]> => {
		const result: T[] = [];
		let offset = 0;

		for (let page = 0; page < MAX_PAGES; page++) {
			const response = await $api<Page<K, T>>(path, {
				query: { profileId, limit: PAGE_SIZE, offset },
			});

			result.push(...response[key]);

			if (!response.hasNext) break;

			offset = response.next;
		}

		return result;
	};

	const fetchLevels = (profileId: string) =>
		fetchAll<"entitlements", LevelEntitlement>(
			"/entitlements/levels",
			"entitlements",
			profileId,
		);

	const fetchBadges = (profileId: string) =>
		fetchAll<"entitlements", BadgeEntitlement>(
			"/entitlements/badges",
			"entitlements",
			profileId,
		);

	const fetchBadgeCatalog = async () =>
		(await $api<{ status: "ok"; badges: Badge[] }>("/badges")).badges;

	// Assigning replaces the entitlements of the same level/badge that expire
	// before the new one (the API revokes them).
	const assignLevel = (
		profileId: string,
		levelId: number,
		form: EntitlementForm,
	) =>
		$api("/entitlements/levels", {
			method: "POST",
			body: { profileId, levelId, ...buildBody(form) },
		});

	const assignBadge = (
		profileId: string,
		badgeId: string,
		form: EntitlementForm,
	) =>
		$api("/entitlements/badges", {
			method: "POST",
			body: { profileId, badgeId, ...buildBody(form) },
		});

	const setEnabled = (kind: EntitlementKind, id: string, enabled: boolean) =>
		$api(
			`/entitlements/${kind}/${encodeURIComponent(id)}/${enabled ? "enable" : "disable"}`,
			{ method: "POST" },
		);

	const revoke = (kind: EntitlementKind, id: string) =>
		$api(`/entitlements/${kind}/${encodeURIComponent(id)}`, {
			method: "DELETE",
		});

	return {
		fetchLevels,
		fetchBadges,
		fetchBadgeCatalog,
		assignLevel,
		assignBadge,
		setEnabled,
		revoke,
	};
};
