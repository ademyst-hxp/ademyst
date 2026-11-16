<script setup lang="ts">
import type { Profile } from "~~/shared/models/profiles";
import type { Badge } from "~~/shared/models/shop";

import Box from "@/components/base/Box.vue";
import EmptyData from "@/components/layout/EmptyData.vue";
import BadgeInfo from "@/components/profile/BadgeInfo.vue";

type ProfileResponse = {
	status: "ok";
	profile: Profile;
	canFollowDirectly: boolean;
};

const route = useRoute();
const { $api } = useNuxtApp();

const { session, refresh: refreshSession } = useAuthSession();
refreshSession();

const name = computed(() => {
	const raw = route.params.name;
	return Array.isArray(raw) ? raw[0] : raw;
});

const requestKey = computed(() => `profile-${name.value ?? "missing"}`);
const { data, pending } = await useAsyncData(requestKey, async () => {
	if (!name.value) throw createError({ statusCode: 400 });

	return $api<ProfileResponse>(`/users/${encodeURIComponent(name.value)}`);
});

const profile = computed(() => data.value?.profile ?? null);

/********************/

definePageMeta({
	layout: "profile",
});

useHead({
	title: profile.value
		? `Badges de ${profile.value.displayName || profile.value.name} | Ademyst`
		: "Profil introuvable | Ademyst",
	meta: [
		{
			name: "description",
			content: profile.value?.bio ?? "Profil utilisateur sur Ademyst.",
		},
		{
			name: "keywords",
			content: `Beam, Ademyst, Profil, ${
				profile.value?.displayName ||
				profile.value?.name ||
				"Utilisateur"
			}, Badges`,
		},
		{
			name: "author",
			content:
				profile.value?.displayName || profile.value?.name || "Ademyst",
		},
		{
			name: "viewport",
			content: "width=device-width, initial-scale=1.0",
		},
		{
			name: "robots",
			content:
				profile.value && (profile.value?.level ?? 0) > 5
					? "index, follow"
					: "noindex, nofollow",
		},
		{
			name: "theme-color",
			content: profile.value?.badge?.color ?? "#ff7050",
		},
		{
			property: "og:title",
			content: profile.value
				? `${profile.value.displayName || profile.value.name} | Ademyst`
				: "Profil introuvable | Ademyst",
		},
		{
			property: "og:description",
			content: profile.value?.bio ?? "Profil utilisateur sur Ademyst.",
		},
		{
			property: "og:image",
			content: profile.value
				? `/api/v1/users/${profile.value.name}/avatar.webp`
				: "/images/default_avatar.png",
		},
		{
			property: "og:url",
			content: profile.value
				? `https://ademyst.ejnalo.me/@${profile.value.name}/badges`
				: "https://ademyst.ejnalo.me/",
		},
		{
			property: "og:type",
			content: "profile",
		},
		{
			name: "twitter:card",
			content: "summary_large_image",
		},
		{
			name: "twitter:title",
			content: profile.value
				? `Badges de ${profile.value.displayName || profile.value.name} | Ademyst`
				: "Profil introuvable | Ademyst",
		},
		{
			name: "twitter:description",
			content: profile.value?.bio ?? "Profil utilisateur sur Ademyst.",
		},
		{
			name: "twitter:image",
			content: profile.value
				? `/api/v1/users/${profile.value.name}/avatar.webp`
				: "/images/default_avatar.png",
		},
	],
});

/*********************/

const tabs = [
	{ name: "Tous", value: "all" },
	{ name: "Grades", value: "level" },
	{ name: "Certifications", value: "certifications" },
	{ name: "Titres", value: "title" },
	{ name: "Récompenses", value: "reward" },
];

const tab = ref<"all" | "level" | "certifications" | "title" | "reward">("all");
const focusedBadge = ref<Badge | null>(null);
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

				<div
					v-if="pending"
					class="bg-muted rounded-full h-3 w-24 animate-pulse"
				/>

				<span v-else class="text-muted text-lg font-semibold">
					{{ `@${profile?.name ?? "ghost"}` }}
				</span>
			</div>
		</section>

		<section class="flex flex-col gap-2">
			<ul>
				<li>
					<RouterLink
						:to="`/@${profile?.name}`"
						class="text-primary font-medium hover:underline"
					>
						Voir le profil
					</RouterLink>
				</li>
				<li v-if="session">
					<RouterLink
						:to="`/settings/badges`"
						class="text-primary font-medium hover:underline"
					>
						Gérer mes badges
					</RouterLink>
				</li>
			</ul>
		</section>
	</Teleport>

	<section>
		<TabBar v-model="tab" :tabs="tabs" />
	</section>

	<section class="space-y-2" v-if="tab === 'all'">
		<div
			v-if="profile?.badges.length"
			class="grid grid-cols-1 gap-2 sm:max-lg:grid-cols-2 xl:grid-cols-3"
		>
			<Box
				v-for="badge in profile?.badges ?? []"
				:key="badge.id"
				class="p-2"
			>
				<img
					:src="`/api/v1/badges/${badge.id}/icon.png`"
					:alt="badge.name"
					class="h-12 w-12"
				/>
				<h3 class="font-bold text-lg">{{ badge.name }}</h3>
				<p class="text-muted text-sm">{{ badge.description }}</p>
				<Button
					label="Voir le badge"
					variant="secondary"
					size="small"
					:handler="() => (focusedBadge = badge)"
				/>
			</Box>
		</div>
		<EmptyData
			v-else-if="!pending"
			title="Aucun badge trouvé"
			message="Cet utilisateur ne possède pas de badges."
		/>
	</section>

	<section class="space-y-2" v-else>
		<div
			v-if="profile?.badges.filter((b) => b.family?.id === tab).length"
			class="grid grid-cols-1 gap-2 sm:max-lg:grid-cols-2 xl:grid-cols-3"
		>
			<Box
				v-for="badge in profile?.badges.filter(
					(b) => b.family?.id === tab,
				) ?? []"
				:key="badge.id"
				class="p-2"
			>
				<img
					:src="`/api/v1/badges/${badge.id}/icon.png`"
					:alt="badge.name"
					class="h-12 w-12"
				/>
				<h3 class="font-bold text-lg">{{ badge.name }}</h3>
				<p class="text-muted text-sm">{{ badge.description }}</p>
				<Button
					label="Voir le badge"
					variant="secondary"
					size="small"
					:handler="() => (focusedBadge = badge)"
				/>
			</Box>
		</div>
		<EmptyData
			v-else-if="!pending"
			title="Aucun badge trouvé"
			message="Cet utilisateur ne possède pas de badges dans cette famille."
		/>
	</section>

	<BadgeInfo
		v-if="focusedBadge"
		:badge="focusedBadge"
		@close="focusedBadge = null"
	/>
</template>
