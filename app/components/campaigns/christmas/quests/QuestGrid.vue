<script setup lang="ts">
import type { QuestState } from "~~/shared/models/campaigns/christmas";

import QuestCard from "./QuestCard.vue";

defineProps<{
	/** Les 25 quêtes de /quests (ou /moderation/users/[id]/quests), par jour. */
	quests: QuestState[];
}>();

defineSlots<{
	/** Contenu additionnel de chaque carte (boutons de modération). */
	actions?(props: { quest: QuestState }): unknown;
}>();
</script>
<template>
	<p
		v-if="quests.length === 0"
		class="p-6 text-center text-surface-text bg-surface rounded-3xl"
	>
		Aucune quête pour l'instant.
	</p>
	<ul v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
		<li v-for="quest in quests" :key="quest.day" class="min-w-0">
			<QuestCard :quest="quest">
				<template v-if="$slots.actions" #actions="{ quest: current }">
					<slot name="actions" :quest="current" />
				</template>
			</QuestCard>
		</li>
	</ul>
</template>
