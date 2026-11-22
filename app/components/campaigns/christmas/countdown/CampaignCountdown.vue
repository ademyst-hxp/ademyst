<script setup lang="ts">
import Box from "~/components/base/Box.vue";

import {
	CHRISTMAS_YEAR,
	getChristmasEnd,
	getChristmasPhase,
	getChristmasStart,
} from "~~/shared/utils/campaigns/christmas";

import CountdownTimer from "./CountdownTimer.vue";

const props = withDefaults(
	defineProps<{
		year?: number;
	}>(),
	{
		year: CHRISTMAS_YEAR,
	},
);

const now = useClock();

const phase = computed(() =>
	getChristmasPhase(now.value ?? Date.now(), props.year),
);
</script>
<template>
	<Box v-if="phase !== 'ended'" class="items-center text-center">
		<h2 class="text-xl font-bold font-title">
			{{
				phase === "upcoming"
					? "Première quête dans..."
					: "L'évènement se termine dans"
			}}
		</h2>
		<CountdownTimer
			:target="
				phase === 'upcoming'
					? getChristmasStart(year)
					: getChristmasEnd(year)
			"
			variant="blocks"
			class="w-full max-w-md"
		/>
		<p class="text-sm text-muted">
			{{
				phase === "upcoming"
					? "Début le 1er décembre à 00:00 (UTC)."
					: "Fin de l'évènement le 25 décembre à minuit (UTC)."
			}}
		</p>
	</Box>
</template>
