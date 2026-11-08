<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		length: number;
		min?: number;
		max?: number;
		/**
		 * ratio     → "min 10 · 42 / 500"  (zones de texte)
		 * remaining → "Encore 5 avant le minimum" puis "458 restants"  (champs courts)
		 */
		format?: "ratio" | "remaining";
	}>(),
	{ format: "ratio", min: undefined, max: undefined },
);

const counter = useTextCounter(
	() => props.length,
	() => ({ min: props.min, max: props.max }),
);

const text = computed(() => {
	const { length, min, max, isShort, isOver, toMin, remaining } =
		counter.value;

	if (props.format === "remaining") {
		if (isShort) return `Encore ${toMin} avant le minimum`;
		if (remaining === null) return ""; // minimum atteint et pas de limite
		if (isOver) return `${-remaining} en trop`;
		return `${remaining} restant${remaining > 1 ? "s" : ""}`;
	}

	if (min === undefined && max === undefined) return "";

	return [
		min !== undefined ? `min ${min} · ` : "",
		length,
		max !== undefined ? ` / ${max}` : "",
	].join("");
});

const title = computed(() => {
	const { length, min, max } = counter.value;
	const parts = [`${length} caractère${length > 1 ? "s" : ""}`];
	if (min !== undefined) parts.push(`minimum ${min}`);
	if (max !== undefined) parts.push(`limite ${max}`);
	return parts.join(" · ");
});
</script>
<template>
	<span
		v-if="text"
		class="shrink-0 whitespace-nowrap text-xs tabular-nums transition-colors"
		:class="counter.colorClass"
		:title="title"
	>
		{{ text }}
	</span>
</template>
