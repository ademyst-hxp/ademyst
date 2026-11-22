<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		/** Instant visé, en millisecondes (Date.UTC(…), Date.now()…). */
		target: number;
		/**
		 * `compact` : « 12 j 03:04:05 » sur une ligne (bannière).
		 * `blocks` : quatre cases Jours / Heures / Minutes / Secondes.
		 */
		variant?: "compact" | "blocks";
	}>(),
	{
		variant: "compact",
	},
);

const now = useClock();

const parts = computed(() => {
	// Avant le montage : emplacement neutre, identique côté serveur et client.
	if (now.value === null) return null;

	const total = Math.max(0, Math.floor((props.target - now.value) / 1000));

	return {
		days: Math.floor(total / 86400),
		hours: Math.floor((total % 86400) / 3600),
		minutes: Math.floor((total % 3600) / 60),
		seconds: total % 60,
	};
});

const pad = (value: number | undefined) =>
	value === undefined ? "––" : String(value).padStart(2, "0");

const units = computed(() => [
	{ key: "days", label: "Jours", value: parts.value?.days },
	{ key: "hours", label: "Heures", value: parts.value?.hours },
	{ key: "minutes", label: "Minutes", value: parts.value?.minutes },
	{ key: "seconds", label: "Secondes", value: parts.value?.seconds },
]);

// Texte lu par les lecteurs d'écran : fixe, pour ne pas annoncer chaque seconde.
const srLabel = computed(() =>
	new Date(props.target).toLocaleString("fr-FR", {
		dateStyle: "long",
		timeStyle: "short",
		timeZone: "UTC",
	}),
);
</script>
<template>
	<!-- role="timer" : aria-live "off" implicite, rien n'est annoncé à chaque tick -->
	<div role="timer" class="tabular-nums">
		<span class="sr-only">Échéance: {{ srLabel }} UTC.</span>

		<span v-if="variant === 'compact'" aria-hidden="true">
			<template v-if="parts && parts.days > 0">
				{{ parts.days }}&nbsp;j&nbsp;
			</template>
			{{ pad(parts?.hours) }}:{{ pad(parts?.minutes) }}:{{
				pad(parts?.seconds)
			}}
		</span>

		<ul
			v-else
			class="grid grid-cols-4 gap-2 text-center"
			aria-hidden="true"
		>
			<li
				v-for="unit in units"
				:key="unit.key"
				class="flex flex-col items-center rounded-2xl bg-white/10 px-1 py-2 sm:py-3"
			>
				<span class="text-2xl font-bold font-title sm:text-4xl">
					{{ pad(unit.value) }}
				</span>
				<span class="text-xs uppercase tracking-wide opacity-80">
					{{ unit.label }}
				</span>
			</li>
		</ul>
	</div>
</template>
