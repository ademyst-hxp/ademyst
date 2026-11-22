<script setup lang="ts">
import type { ModerationStatsResponse } from "~~/shared/models/campaigns/christmas";

import StatTile from "../common/StatTile.vue";

defineProps<{
	stats: Pick<
		ModerationStatsResponse,
		"participants" | "totalCompletions" | "points"
	>;
}>();

const formatNumber = (value: number) =>
	value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
</script>
<template>
	<div class="grid grid-cols-2 gap-2 lg:grid-cols-4">
		<StatTile
			label="Participants"
			:value="formatNumber(stats.participants)"
			hint="Au moins une quête validée"
		/>
		<StatTile
			label="Validations"
			:value="formatNumber(stats.totalCompletions)"
			hint="Toutes quêtes confondues"
		/>
		<StatTile
			label="Points (max)"
			:value="formatNumber(stats.points.max)"
			hint="Meilleur score actuel"
		/>
		<StatTile
			label="Points (moyenne)"
			:value="formatNumber(stats.points.average)"
			hint="Par participant"
		/>
	</div>
</template>
