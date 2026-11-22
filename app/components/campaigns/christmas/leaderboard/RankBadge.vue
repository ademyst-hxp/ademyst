<script setup lang="ts">
const props = defineProps<{
	/** Rang à égalité de points : plusieurs profils peuvent partager le rang 2. */
	rank: number;
}>();

// Podium : le chiffre reste affiché, la médaille n'est qu'un renfort visuel.
const MEDALS: Record<number, string> = {
	1: "bg-primary",
	2: "bg-[#c5cad6]",
	3: "bg-[#cd7f32]",
};

const medal = computed(() => MEDALS[props.rank] ?? null);
</script>
<template>
	<span
		class="flex shrink-0 items-center justify-center h-9 w-9 rounded-full font-title font-bold tabular-nums"
		:class="
			medal
				? [medal, 'text-white']
				: 'bg-surface/60 text-surface-text/80 text-sm'
		"
		:aria-label="`Rang ${rank}`"
	>
		{{ rank }}
	</span>
</template>
