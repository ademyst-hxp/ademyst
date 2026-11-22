<script setup lang="ts">
import type { LeaderboardEntry } from "~~/shared/models/campaigns/christmas";

import ProfileRow from "~/components/profile/ProfileRow.vue";
import RankBadge from "./RankBadge.vue";

defineProps<{
	entry: LeaderboardEntry;
	/** Met en avant la ligne de la personne connectée. */
	highlighted?: boolean;
}>();
</script>
<template>
	<div
		class="flex items-center gap-3 px-3 py-3 sm:px-4"
		:class="highlighted ? 'bg-primary/15' : ''"
		:aria-current="highlighted ? 'true' : undefined"
	>
		<RankBadge :rank="entry.rank" />
		<div class="grow min-w-0">
			<ProfileRow :data="entry.profile" />
		</div>
		<span
			v-if="highlighted"
			class="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white"
		>
			Vous
		</span>
		<div class="shrink-0 flex flex-col items-end leading-tight">
			<span
				class="text-lg font-bold font-title tabular-nums text-primary"
			>
				{{ entry.points }} pts
			</span>
			<span class="text-xs text-surface-text/70">
				{{ entry.completedQuests }}
				{{ entry.completedQuests > 1 ? "quêtes" : "quête" }}
			</span>
		</div>
	</div>
</template>
