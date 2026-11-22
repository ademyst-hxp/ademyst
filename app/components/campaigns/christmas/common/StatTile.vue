<script setup lang="ts">
import Box from "~/components/base/Box.vue";

defineProps<{
	label: string;
	value: string | number;
	/** Précision sous la valeur (ex. « sur 25 quêtes »). */
	hint?: string;
}>();
</script>
<template>
	<Box scale="sm" class="justify-center">
		<span
			class="text-3xl font-bold font-title tabular-nums text-primary"
		>
			{{ value }}
		</span>
		<span class="font-medium">{{ label }}</span>
		<span v-if="hint" class="text-sm text-surface-text/70">
			{{ hint }}
		</span>
		<slot />
	</Box>
</template>
