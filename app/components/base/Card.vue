<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		scale?: "sm" | "md";
		layout?:
			"horizontal" | "vertical" | "horizontal-divide" | "vertical-divide";
		customColor?: string;
		variant?: "default";
	}>(),
	{
		scale: "md",
		layout: "vertical",
		variant: "default",
	},
);

import Box from "./Box.vue";
</script>
<template>
	<Box
		:scale="scale"
		:layout="layout"
		:customColor="customColor"
		:variant="variant"
	>
		<slot />
	</Box>
</template>
