<script setup lang="ts">
import type { Profile } from "~~/shared/models/profiles";
import type {
	BadgeEntitlement,
	LevelEntitlement,
} from "~~/shared/models/entitlements";
import type { EntitlementForm } from "~/composables/useEntitlements";

import { LEVELS } from "~~/shared/consts/labels";

import EntitlementGroup from "~/components/subscription/EntitlementGroup.vue";

type ProfileResponse = {
	status: "ok";
	profile: Profile;
};

const route = useRoute();
const { $api } = useNuxtApp();
const { session } = useAuthSession();
const {
	fetchLevels,
	fetchBadges,
	fetchBadgeCatalog,
	assignLevel,
	assignBadge,
	setEnabled,
	revoke,
} = useEntitlements();

definePageMeta({
	layout: "profile",
	middleware: ["auth", "team"],
});

const name = computed(() => {
	const raw = route.params.name;
	return Array.isArray(raw) ? raw[0] : raw;
});

const { data, pending } = await useAsyncData(
	`subscription-profile-${name.value ?? "missing"}`,
	async () => {
		if (!name.value) throw createError({ statusCode: 400 });

		return $api<ProfileResponse>(
			`/users/${encodeURIComponent(name.value)}`,
		);
	},
);

// The profile (level, badges) changes with the entitlements.
const requestKey = () => `subscription-profile-${name.value ?? "missing"}`;

const profile = computed<Profile | null>(() => data.value?.profile ?? null);

const { data: levels, refresh: refreshLevels } = await useAsyncData(
	`subscription-levels-${name.value ?? "missing"}`,
	async () => (profile.value ? await fetchLevels(profile.value.id) : []),
);

const { data: badges, refresh: refreshBadges } = await useAsyncData(
	`subscription-badges-${name.value ?? "missing"}`,
	async () => (profile.value ? await fetchBadges(profile.value.id) : []),
);

const { data: catalog } = await useAsyncData("subscription-badge-catalog", () =>
	fetchBadgeCatalog(),
);

const refreshAll = () =>
	Promise.all([
		refreshLevels(),
		refreshBadges(),
		refreshNuxtData(requestKey()),
	]);

const myLevel = computed(() => session.value?.profile.level ?? 0);

// Same rule as the API: acting on a member of the team (level 8+) requires
// level 9, anyone else level 8.
const canManageTarget = computed(
	() => (profile.value?.level ?? 0) < 8 || myLevel.value >= 9,
);

const levelItems = computed<LevelEntitlement[]>(() => levels.value ?? []);
const badgeItems = computed<BadgeEntitlement[]>(() => badges.value ?? []);

const premiumItems = computed(() =>
	levelItems.value.filter((item) => item.level.id === PREMIUM_LEVEL),
);
const verifiedItems = computed(() =>
	levelItems.value.filter((item) => item.level.id === VERIFIED_LEVEL),
);
const moderationItems = computed(() =>
	levelItems.value.filter((item) => item.level.id >= MODERATION_MIN_LEVEL),
);

const itemsOfBadge = (badgeId: string) =>
	badgeItems.value.filter((item) => item.badge.id === badgeId);

const badgeWarning = (badgeId: string) =>
	catalog.value && !catalog.value.some((badge) => badge.id === badgeId)
		? `Le badge « ${badgeId} » n'existe pas en base : corrige VERIFIED_BADGES dans utils/subscription.ts.`
		: undefined;

const levelLabel = computed(() => {
	if (!profile.value) return "Inconnu";

	const level = profile.value.level;
	return level in LEVELS
		? LEVELS[level as keyof typeof LEVELS].label
		: "Inconnu";
});

/* Actions: the group displays the error, the lists are reloaded afterwards. */
const done = async <T,>(action: Promise<T>) => {
	await action;
	await refreshAll();
};

const assignLevelTo = (levelId: number) => (form: EntitlementForm) =>
	done(assignLevel(profile.value!.id, levelId, form));

const assignBadgeTo = (badgeId: string) => (form: EntitlementForm) =>
	done(assignBadge(profile.value!.id, badgeId, form));

const toggleLevel = (item: { id: string }, enabled: boolean) =>
	done(setEnabled("levels", item.id, enabled));

const toggleBadge = (item: { id: string }, enabled: boolean) =>
	done(setEnabled("badges", item.id, enabled));

const revokeLevel = (item: { id: string }) => done(revoke("levels", item.id));

const revokeBadge = (item: { id: string }) => done(revoke("badges", item.id));

// Moderation levels can only be changed below the viewer's own level.
const canActOnModeration = (item: LevelEntitlement | BadgeEntitlement) =>
	"level" in item && item.level.id < myLevel.value;

useHead({
	title: `Abonnement de ${profile.value?.displayName ?? profile.value?.name ?? "Ghost"} | Ademyst`,
	meta: [
		{
			name: "robots",
			content: "noindex, nofollow",
		},
	],
});
</script>
<template>
	<Teleport to="#header">
		<section class="flex gap-4 items-center">
			<img
				:src="`/api/v1/users/${profile?.name}/avatar.webp`"
				class="w-24 h-24 rounded-full"
			/>

			<div class="-space-y-2">
				<div
					v-if="pending"
					class="bg-muted rounded-full h-3 w-32 animate-pulse"
				/>

				<h1 v-else class="flex items-center gap-2 text-3xl font-bold">
					{{
						profile?.displayName ??
						(profile?.name ? `@${profile.name}` : "Ghost")
					}}
					<img
						v-if="profile?.badge"
						:src="`/api/v1/badges/${profile?.badge?.id}/icon.png`"
						:alt="profile?.badge?.name"
						class="h-6 w-6"
					/>
				</h1>

				<span class="text-muted text-lg font-semibold">
					{{ `@${profile?.name ?? "ghost"}` }}
				</span>
			</div>
		</section>

		<section class="flex flex-col -space-y-1 px-4">
			<span class="text-2xl font-bold">{{ levelLabel }}</span>
			<span class="text-muted">Niveau actuel</span>
		</section>

		<section class="flex items-center gap-2 px-4">
			<Button
				label="Profil"
				variant="secondary"
				size="small"
				:handler="`/@${profile?.name}`"
			/>
			<Button
				label="Modération"
				variant="secondary"
				size="small"
				:handler="`/@${profile?.name}/moderate`"
			/>
		</section>
	</Teleport>

	<p v-if="!canManageTarget" class="px-8 text-warning">
		Ce membre fait partie de l'équipe : seul un grade 9 peut modifier ses
		accès.
	</p>

	<section class="space-y-2">
		<h2 class="px-8 text-2xl font-bold">Premium</h2>
		<EntitlementGroup
			title="Abonnement Premium"
			description="Palier Premium (niveau 4)."
			:items="premiumItems"
			:manageable="canManageTarget"
			assign-label="Accorder Premium"
			:assign="assignLevelTo(PREMIUM_LEVEL)"
			:toggle="toggleLevel"
			:revoke="revokeLevel"
		/>
	</section>

	<section class="space-y-2">
		<h2 class="px-8 text-2xl font-bold">Certifications</h2>
		<EntitlementGroup
			title="Certification"
			description="Palier Vérifié (niveau 5) : à accorder avec l'un des badges ci-dessous."
			:items="verifiedItems"
			:manageable="canManageTarget"
			assign-label="Certifier le compte"
			:assign="assignLevelTo(VERIFIED_LEVEL)"
			:toggle="toggleLevel"
			:revoke="revokeLevel"
		/>
		<h3 class="px-8 text-2xl font-bold">Badges de certification</h3>
		<div v-if="verifiedItems.length > 0" class="grid grid-cols-1 gap-2 md:grid-cols-2">
			<EntitlementGroup
				v-for="badge in VERIFIED_BADGES"
				:key="badge.id"
				:title="badge.name"
				:badge="badge as BadgeEntitlement['badge']"
				:description="badge.description"
				:items="itemsOfBadge(badge.id)"
				:manageable="canManageTarget"
				:warning="badgeWarning(badge.id)"
				assign-label="Attribuer le badge"
				:assign="assignBadgeTo(badge.id)"
				:toggle="toggleBadge"
				:revoke="revokeBadge"
			/>
		</div>
	</section>

	<section class="space-y-2">
		<h2 class="px-8 text-2xl font-bold">Modération</h2>
		<EntitlementGroup
			title="Grades de modération"
			description="Niveaux 6 et supérieurs, attribués depuis l'Espace modération."
			:items="moderationItems"
			:manageable="canManageTarget"
			:can-act="canActOnModeration"
			show-item-title
			assign-label="Gérer dans l'espace modération"
			:assign-href="`/moderation/team/new?user=${profile?.name}`"
			:toggle="toggleLevel"
			:revoke="revokeLevel"
		/>
	</section>
</template>
