<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		value: number;
		max: number;
		/** Texte lu par les lecteurs d'écran (ex. « Progression de la quête 7 »). */
		label: string;
		/** Affiche « value / max » à droite de la barre. */
		showValue?: boolean;
	}>(),
	{
		showValue: false,
	},
);

const percent = computed(() => {
	if (props.max <= 0) return 0;

	return Math.min(100, Math.max(0, (props.value / props.max) * 100));
});
</script>
<template>
	<div class="flex items-center gap-3">
		<div
			role="progressbar"
			:aria-label="label"
			:aria-valuemin="0"
			:aria-valuemax="max"
			:aria-valuenow="Math.min(value, max)"
			class="grow h-2.5 rounded-full bg-muted-background overflow-hidden"
		>
			<div
				class="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
				:style="{ width: `${percent}%` }"
			/>
		</div>
		<span
			v-if="showValue"
			class="shrink-0 text-sm font-semibold tabular-nums text-surface-text-muted"
		>
			{{ value }} / {{ max }}
		</span>
	</div>
</template>
