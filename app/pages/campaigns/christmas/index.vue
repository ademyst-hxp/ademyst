<script setup lang="ts">
import {
	GiftIcon,
	SparklesIcon,
	TrophyIcon,
} from "@heroicons/vue/24/outline";

import Box from "~/components/base/Box.vue";
import Button from "~/components/Button.vue";
import TabBar from "~/components/TabBar.vue";
import CampaignCountdown from "~/components/campaigns/christmas/countdown/CampaignCountdown.vue";

const tab = ref("presentation");

watch(tab, (value) => {
	if (value === "quests") navigateTo("/campaigns/christmas/quests");
	if (value === "leaderboard") navigateTo("/campaigns/christmas/leaderboard");
});

definePageMeta({
	title: "Ademyst: Quêtes de Noël",
	description: "Présentation de l'évènement Quêtes de Noël 2026.",
});

useHead({
	title: "Ademyst: Quêtes de Noël",
	meta: [
		{
			name: "description",
			content: "Découvrez les quêtes, les points et les récompenses des Quêtes de Noël.",
		},
	],
});
</script>
<template>
	<Teleport to="#header">
		<div class="flex flex-col gap-3">
			<h1 class="text-3xl font-bold text-center font-title">
				Quêtes de Noël
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

	<section class="flex flex-col gap-2">
		<Box class="relative overflow-hidden">
			<div
				class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10"
				aria-hidden="true"
			/>
			<div class="relative flex items-start gap-4">
				<div class="flex flex-col gap-2">
					<p class="text-sm font-semibold uppercase tracking-wider text-primary">
						Édition 2026
					</p>
					<h2 class="text-2xl font-bold font-title">
						Une quête par jour, 3 badges à la clé !
					</h2>
					<p class="text-surface-text/80">
						Réalise une nouvelle quête chaque jour du 1er au 25 décembre.
						Elles rapportent des points, visibles dans ton progression
						personnelle et au classement général.
					</p>
				</div>
			</div>
			<div class="relative flex flex-wrap gap-2">
				<Button
					label="Voir mes quêtes"
					variant="primary"
					size="small"
					handler="/campaigns/christmas/quests"
				/>
				<Button
					label="Voir le classement"
					variant="white"
					size="small"
					handler="/campaigns/christmas/leaderboard"
				/>
			</div>
		</Box>
	</section>

	<CampaignCountdown />
</template>
