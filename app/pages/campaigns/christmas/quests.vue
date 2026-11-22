<script setup lang="ts">
import type { QuestsResponse } from "~~/shared/models/campaigns/christmas";

import TabBar from "~/components/TabBar.vue";
import Button from "~/components/Button.vue";
import Box from "~/components/base/Box.vue";
import CampaignBanner from "~/components/campaigns/christmas/banners/CampaignBanner.vue";
import QuestGrid from "~/components/campaigns/christmas/quests/QuestGrid.vue";
import QuestSummary from "~/components/campaigns/christmas/quests/QuestSummary.vue";

const { $api } = useNuxtApp();
const { session, refresh: refreshSession } = useAuthSession();

await refreshSession();

definePageMeta({
	title: "Ademyst: Mes quêtes de Noël",
	description: "Suivi de la progression aux Quêtes de Noël 2026.",
	middleware: ["auth"],
});

useHead({
	title: "Ademyst: Mes quêtes de Noël",
	meta: [
		{
			name: "description",
			content: "Suivez vos quêtes de Noël et vos points.",
		},
		{
			name: "robots",
			content: "noindex, nofollow",
		},
	],
});

const tab = ref("quests");

watch(tab, (value) => {
	if (value === "presentation") navigateTo("/campaigns/christmas");
	if (value === "leaderboard") navigateTo("/campaigns/christmas/leaderboard");
});

const report = ref<QuestsResponse | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const visibleQuests = computed(
	() => report.value?.data.filter((quest) => quest.status !== "locked") ?? [],
);

const refresh = async () => {
	loading.value = true;
	error.value = null;

	try {
		report.value = await $api<QuestsResponse>(
			"/campaigns/christmas/quests",
		);
	} catch (caught) {
		error.value =
			caught instanceof Error
				? caught.message
				: "Impossible de charger les quêtes.";
	} finally {
		loading.value = false;
	}
};

await useAsyncData("christmas-quests", refresh);
</script>
<template>
	<Teleport to="#header">
		<div class="flex flex-col gap-3">
			<h1 class="text-3xl font-bold text-center font-title">
				Mes quêtes
			</h1>
			<TabBar
				v-model="tab"
				:tabs="[
					{ name: 'Présentation', value: 'presentation' },
					{ name: 'Quêtes', value: 'quests' },
					{ name: 'Classement', value: 'leaderboard' },
				]"
			/>
		</div>
	</Teleport>

	<CampaignBanner
		v-if="report"
		:year="report.campaign.year"
		:today="report.campaign.today"
		:started="report.campaign.started"
		:ended="report.campaign.ended"
	/>

	<p v-if="loading" class="p-6 text-center text-muted" role="status">
		Chargement des quêtes…
	</p>

	<Box
		v-else-if="error"
		class="items-center text-center"
		role="alert"
	>
		<p>{{ error }}</p>
		<Button
			label="Réessayer"
			size="small"
			:handler="refresh"
		/>
	</Box>

	<template v-else-if="report">
		<QuestSummary :summary="report.summary" />
		<QuestGrid :quests="visibleQuests" />
	</template>
</template>
