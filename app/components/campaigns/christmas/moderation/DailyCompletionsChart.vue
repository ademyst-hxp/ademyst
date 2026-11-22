<script setup lang="ts">
import type {
	ModerationStatsResponse,
	QuestLevel,
} from "~~/shared/models/campaigns/christmas";

import Box from "~/components/base/Box.vue";

const props = defineProps<{
	days: ModerationStatsResponse["days"];
	/** Jour en cours (1-25), null hors campagne. */
	today: number | null;
}>();

// Mêmes couleurs que les formes de quêtes.
const LEVEL_COLORS: Record<QuestLevel, string> = {
	secondary: "#56FC7F",
	normal: "#1AABFF",
	super: "#FB1AFF",
	ultra: "#DB0016",
	final: "#C89938",
};

const max = computed(() =>
	props.days.reduce((highest, day) => Math.max(highest, day.completions), 0),
);

const heightOf = (completions: number) => {
	if (completions <= 0 || max.value <= 0) return 0;

	// Une barre non nulle reste toujours visible.
	return Math.max(4, (completions / max.value) * 100);
};
</script>
<template>
	<Box>
		<div class="flex flex-col">
			<h3 class="text-xl font-bold font-title">Validations par quête</h3>
			<p class="text-sm text-surface-text/70">
				Une barre par jour, colorée selon le niveau de la quête.
			</p>
		</div>

		<div class="overflow-x-auto">
			<ol class="flex items-end gap-1 min-w-136">
				<li
					v-for="day in days"
					:key="day.day"
					class="flex grow basis-0 flex-col items-center gap-1 rounded-lg px-0.5 pb-1"
					:class="day.day === today ? 'bg-white/10' : ''"
				>
					<!-- Lecteurs d'écran : une phrase par jour, la barre est décorative. -->
					<span class="sr-only">
						Jour {{ day.day }}, {{ day.title }} :
						{{ day.completions }} validation{{
							day.completions > 1 ? "s" : ""
						}}
					</span>
					<span
						class="text-xs tabular-nums text-surface-text/80"
						aria-hidden="true"
					>
						{{ day.completions }}
					</span>
					<div
						class="flex h-40 w-full items-end"
						aria-hidden="true"
						:title="`Jour ${day.day} · ${day.title}`"
					>
						<div
							class="w-full rounded-t-md transition-[height] duration-500"
							:class="day.completions === 0 ? 'h-px bg-white/30' : ''"
							:style="
								day.completions === 0
									? undefined
									: {
											height: `${heightOf(day.completions)}%`,
											backgroundColor: LEVEL_COLORS[day.level],
										}
							"
						/>
					</div>
					<span
						class="text-xs font-semibold tabular-nums"
						:class="
							day.day === today
								? 'text-primary'
								: 'text-surface-text/70'
						"
						aria-hidden="true"
					>
						{{ day.day }}
					</span>
				</li>
			</ol>
		</div>
	</Box>
</template>
