<script setup lang="ts">
import type { QuestsReport } from "~~/shared/models/campaigns/christmas";

import Box from "~/components/base/Box.vue";
import ProgressBar from "../common/ProgressBar.vue";

defineProps<{
	/** `summary` de /quests. */
	summary: QuestsReport["summary"];
}>();
</script>
<template>
	<Box>
		<div class="flex items-end justify-between gap-4">
			<div class="flex flex-col">
				<span
					class="text-4xl font-bold font-title tabular-nums text-primary"
				>
					{{ summary.points }} pts
				</span>
				<span class="text-surface-text-muted">
					Total des points gagnés
				</span>
			</div>
			<div class="flex flex-col items-end">
				<span class="text-2xl font-bold font-title tabular-nums">
					{{ summary.completed }} / {{ summary.total }}
				</span>
				<span class="text-surface-text-muted">
					Quêtes validées
				</span>
			</div>
		</div>
		<ProgressBar
			:value="summary.completed"
			:max="summary.total"
			label="Quêtes validées"
		/>
		<slot />
	</Box>
</template>
