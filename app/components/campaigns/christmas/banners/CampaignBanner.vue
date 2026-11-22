<script setup lang="ts">
import { SparklesIcon } from "@heroicons/vue/24/outline";

const props = withDefaults(
	defineProps<{
		year: number;
		/** Jour de quête en cours (1-25), null hors campagne. */
		today: number | null;
		/**
		 * Fournis par /quests (campaign.started / campaign.ended). Absents des
		 * statistiques de modération : l'état est alors déduit de la date.
		 */
		started?: boolean;
		ended?: boolean;
		title?: string;
	}>(),
	{
		title: "Quêtes de Noël",
	},
);

const TOTAL_DAYS = 25;

const phase = computed<"upcoming" | "running" | "ended">(() => {
	if (props.ended) return "ended";
	if (props.today !== null) return "running";
	if (props.started === false) return "upcoming";

	// Pas d'indication de l'API : jours de quête = 1er au 25 décembre (UTC).
	const now = Date.now();

	if (now < Date.UTC(props.year, 11, 1)) return "upcoming";
	if (now >= Date.UTC(props.year, 11, TOTAL_DAYS + 1)) return "ended";

	return "running";
});

const subtitle = computed(() => {
	switch (phase.value) {
		case "upcoming":
			return `Les quêtes démarrent le 1er décembre ${props.year}.`;
		case "ended":
			return `La campagne ${props.year} est terminée.`;
		default:
			return props.today !== null
				? `Jour ${props.today} sur ${TOTAL_DAYS}`
				: `Campagne ${props.year} en cours`;
	}
});
</script>
<template>
	<section
		class="flex flex-col gap-4 bg-surface text-surface-text border border-surface-border rounded-3xl p-4 sm:p-6"
	>
		<div class="flex items-center gap-4">
			<div
				class="flex shrink-0 items-center justify-center h-12 w-12 rounded-full bg-primary text-surface"
				aria-hidden="true"
			>
				<SparklesIcon class="text-white h-7 w-7" />
			</div>
			<div class="grow min-w-0 flex flex-col">
				<h2 class="text-2xl font-bold font-title">
					{{ title }} {{ year }}
				</h2>
				<p class="text-surface-text/70">{{ subtitle }}</p>
			</div>
			<slot name="actions" />
		</div>

		<!-- Frise des 25 jours (décorative : le texte ci-dessus porte l'info) -->
		<ol
			v-if="phase !== 'upcoming'"
			class="flex items-center gap-1"
			aria-hidden="true"
		>
			<li
				v-for="day in TOTAL_DAYS"
				:key="day"
				class="h-2 grow rounded-full"
				:class="
					day === today
						? 'bg-secondary ring-2 ring-secondary/40'
						: phase === 'ended' || (today !== null && day < today)
							? 'bg-primary'
							: 'bg-white/15'
				"
			/>
		</ol>
		<slot />
	</section>
</template>
