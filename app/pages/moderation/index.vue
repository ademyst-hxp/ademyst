<script setup lang="ts">
import Box from "~/components/base/Box.vue";

import { LEVELS } from "~~/shared/consts/labels";

const { $api } = useNuxtApp();

const { session, refresh: refreshSession } = useAuthSession();
const { counts, loadCounts } = useReports();

const refreshReports = () => loadCounts();

await refreshSession();

const profile = session.value?.profile;

if (!profile) {
	await navigateTo("/auth/login");
}

const levelLabel = computed(() => {
	if (!profile) return "Inconnu";

	const level = profile.level;
	return level in LEVELS
		? LEVELS[level as keyof typeof LEVELS].label
		: "Inconnu";
});

const levelDescription = computed(() => {
	if (!profile) return "Inconnu";

	const level = profile.level;
	return level in LEVELS
		? LEVELS[level as keyof typeof LEVELS].description
		: "Inconnu";
});

const levelBadge = computed(() => {
	if (!profile) return null;

	const level = profile.level;
	return level in LEVELS ? LEVELS[level as keyof typeof LEVELS].badge : null;
});

// Fetched once on the server and reused from the payload when hydrating,
// instead of running again in the browser.
await useAsyncData("moderation-reports", async () => {
	await refreshReports();

	return true;
});

definePageMeta({
	title: "Ademyst: Espace Modération",
	description: "Panel de modération pour les modérateurs d'Ademyst.",
	middleware: ["auth", "moderation"],
});

useHead({
	title: "Ademyst: Espace Modération",
	meta: [
		{
			name: "viewport",
			content: "width=device-width, initial-scale=1.0",
		},
		{
			name: "robots",
			content: "noindex, nofollow",
		},
	],
});
</script>
<template>
	<Teleport to="#header">
		<h1 class="text-3xl font-bold text-center font-title">
			Espace Modération
		</h1>
	</Teleport>

	<section class="flex flex-col gap-2">
		<h2 class="text-2xl font-bold font-title text-center">
			Vue d'ensemble
		</h2>
		<div
			class="grid grid-cols-1 gap-2 sm:max-md:grid-cols-2 xl:grid-cols-2"
		>
			<Box class="items-center" layout="horizontal">
				<img
					v-if="levelBadge"
					:src="`/api/v1/badges/${levelBadge}/icon.png`"
					:alt="levelBadge"
					class="h-8 w-8"
				/>
				<div class="flex flex-col">
					<h3 class="text-2xl font-bold">Grade {{ levelLabel }}</h3>
					<p class="text-muted">
						{{ levelDescription }}
					</p>
				</div>
			</Box>
			<Box class="justify-center">
				<h3 class="text-lg font-bold">Code de conduite</h3>
				<p class="text-muted">
					Avant de modérer, assurez-vous de bien connaître le code de
					conduite de modération d'Ademyst.
				</p>
				<Button
					label="Un peu de lecture !"
					size="small"
					:handler="() => navigateTo('/moderation/guidelines')"
				/>
			</Box>
		</div>
	</section>
	<section class="flex flex-col gap-2">
		<h2 class="text-2xl font-bold font-title text-center">
			Signalements récents
		</h2>
		<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
			<Box class="col-span-1 sm:col-span-2 md:col-span-3" scale="sm">
				<p class="text-2xl font-bold">
					{{ counts.total ?? 0 }}
				</p>
				<span class="text-muted">Signalements en attente</span>
				<div class="flex items-center gap-2 mt-2">
					<Button
						label="Gérer"
						size="small"
						:handler="() => navigateTo('/moderation/reports')"
					/>
					<Button
						label="Rafraîchir"
						variant="white"
						size="small"
						:handler="refreshReports"
					/>
				</div>
			</Box>
			<Box scale="sm">
				<p class="text-2xl font-bold">
					{{ counts.profiles ?? 0 }}
				</p>
				<span class="text-muted">Profils signalés</span>
			</Box>
			<Box scale="sm">
				<p class="text-2xl font-bold">
					{{ counts.posts ?? 0 }}
				</p>
				<span class="text-muted">Publications signalées</span>
			</Box>
			<Box scale="sm">
				<p class="text-2xl font-bold">
					{{ counts.whispers ?? 0 }}
				</p>
				<span class="text-muted">Pensées signalées</span>
			</Box>
		</div>
	</section>
	<section class="flex flex-col gap-2">
		<h2 class="text-2xl font-bold font-title text-center">
			Gérer les membres de l'équipe
		</h2>
		<Box v-if="(profile?.level ?? 0) >= 8" class="justify-center">
			<h3 class="text-lg font-bold">Équipe de modération</h3>
			<p class="text-muted">
				Ajoutez, modifiez ou retirez les membres de l'équipe.
			</p>
			<Button
				label="Gérer l'équipe"
				size="small"
				:handler="() => navigateTo('/moderation/team')"
			/>
		</Box>
	</section>
</template>
