<script setup lang="ts">
import type { ModerationStatsResponse } from "~~/shared/models/campaigns/christmas";

import Box from "~/components/base/Box.vue";
import ProgressBar from "../common/ProgressBar.vue";

const props = defineProps<{
	rewards: ModerationStatsResponse["rewards"];
	participants: number;
	/** Noms lisibles des badges, par identifiant (sinon l'identifiant est mis en forme). */
	badgeNames?: Record<string, string>;
}>();

const nameOf = (badgeId: string) => {
	const known = props.badgeNames?.[badgeId];

	if (known) return known;

	const spaced = badgeId.replaceAll("_", " ");

	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const validity = (years: number | null) =>
	years === null ? "Permanent" : `${years} an${years > 1 ? "s" : ""}`;

// Du palier le plus haut au plus bas, comme la liste cumulative du cron.
const sorted = computed(() =>
	[...props.rewards].sort((a, b) => b.minPoints - a.minPoints),
);
</script>
<template>
	<Box>
		<div class="flex flex-col">
			<h3 class="text-xl font-bold font-title">Badges de récompense</h3>
			<p class="text-sm text-surface-text/70">
				Simulation en direct : profils qui recevraient chaque badge si
				la distribution avait lieu maintenant. La distribution réelle
				se fait le 24 décembre à 23:59 UTC.
			</p>
		</div>
		<ul class="flex flex-col gap-4">
			<li
				v-for="reward in sorted"
				:key="reward.badgeId"
				class="flex items-center gap-3"
			>
				<img
					:src="`/api/v1/badges/${reward.badgeId}/icon.png`"
					:alt="nameOf(reward.badgeId)"
					class="h-10 w-10 shrink-0"
				/>
				<div class="grow min-w-0 flex flex-col gap-1">
					<div class="flex flex-wrap items-baseline justify-between gap-x-3">
						<span class="font-semibold">
							{{ nameOf(reward.badgeId) }}
						</span>
						<span
							class="text-sm text-surface-text/70"
						>
							dès {{ reward.minPoints }} pts ·
							{{ validity(reward.years) }}
						</span>
					</div>
					<ProgressBar
						:value="reward.eligible"
						:max="participants"
						:label="`${reward.eligible} profils éligibles sur ${participants} participants`"
					/>
				</div>
				<span
					class="shrink-0 w-16 text-right text-lg font-bold font-title tabular-nums text-primary"
				>
					{{ reward.eligible }}
				</span>
			</li>
		</ul>
	</Box>
</template>
