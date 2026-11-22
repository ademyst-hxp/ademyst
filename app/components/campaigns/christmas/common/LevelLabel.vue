<script setup lang="ts">
import {
	LEVEL_REWARDS,
	type QuestLevel,
} from "~~/shared/models/campaigns/christmas";

const props = withDefaults(
	defineProps<{
		level: QuestLevel;
		/** Ajoute les points de la quête : « Super · 8 pts ». */
		showReward?: boolean;
	}>(),
	{
		showReward: false,
	},
);

// Couleurs des formes de quêtes (voir quests/*Quest.vue).
const LEVELS: Record<QuestLevel, { label: string; color: string }> = {
	secondary: { label: "Secondaire", color: "#56FC7F" },
	normal: { label: "Normale", color: "#1AABFF" },
	super: { label: "Super", color: "#FB1AFF" },
	ultra: { label: "Ultra", color: "#DB0016" },
	final: { label: "Finale", color: "#C89938" },
};

const meta = computed(() => LEVELS[props.level]);
</script>
<template>
	<span
		class="inline-flex items-center gap-1.5 w-fit rounded-full bg-surface/60 px-2.5 py-0.5 text-xs font-semibold text-surface-text"
	>
		<span
			class="h-2 w-2 rounded-full"
			:style="{ backgroundColor: meta.color }"
			aria-hidden="true"
		/>
		{{ meta.label }}
		<template v-if="showReward">
			· {{ LEVEL_REWARDS[level] }} pts
		</template>
	</span>
</template>
