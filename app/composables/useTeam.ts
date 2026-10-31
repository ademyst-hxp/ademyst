import type { Profile } from "~~/shared/models/profiles";
import type { LevelEntitlement } from "~~/shared/models/entitlements";

import { LEVELS } from "~~/shared/consts/labels";

// Levels that make up the moderation team (> 5 in the API).
export const TEAM_LEVELS = [6, 7, 8, 9] as const;

type TeamResponse = {
	status: "ok";
	memberships: LevelEntitlement[];
	next: number;
	hasNext: boolean;
};

export type MemberForm = {
	name?: string;
	reason?: string;
	expiresAt?: string | null;
};

// Number of members requested per page (the API caps it at 100).
const PAGE_SIZE = 20;

export const getLevelLabel = (level: number) =>
	level in LEVELS
		? LEVELS[level as keyof typeof LEVELS].label
		: `Grade ${level}`;

export const useTeam = () => {
	const { $api } = useNuxtApp();

	// "all" lists every team member, a level only the members of this grade.
	const fetchPage = (level: number | "all", offset: number) =>
		$api<TeamResponse>(
			level === "all"
				? "/moderation/teams"
				: `/moderation/teams/${level}/members`,
			{ query: { limit: PAGE_SIZE, offset } },
		);

	// Assigning a level replaces the previous one (the API removes it).
	const assign = (level: number, profileId: string, form: MemberForm) =>
		$api<{ status: "ok"; entitlement: LevelEntitlement }>(
			`/moderation/teams/${level}/members`,
			{
				method: "POST",
				query: { profileId },
				body: {
					name: form.name || undefined,
					reason: form.reason || undefined,
					expiresAt: form.expiresAt || undefined,
				},
			},
		);

	const remove = (level: number, profileId: string) =>
		$api<{ status: "ok" }>(
			`/moderation/teams/${level}/members/${encodeURIComponent(profileId)}`,
			{ method: "DELETE" },
		);

	const findProfile = async (name: string) => {
		const clean = name.trim().replace(/^@/, "");

		if (!clean) return null;

		try {
			const response = await $api<{ status: "ok"; profile: Profile }>(
				`/users/${encodeURIComponent(clean)}`,
			);

			return response.profile;
		} catch {
			return null;
		}
	};

	return { fetchPage, assign, remove, findProfile };
};
