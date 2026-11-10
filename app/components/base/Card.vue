<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		scale?: "sm" | "md";
		layout?:
			"horizontal" | "vertical" | "horizontal-divide" | "vertical-divide";
		customColor?: string;
	}>(),
	{
		scale: "md",
		layout: "vertical",
	},
);

import Box from "./Box.vue";
</script>
<template>
	<Box :scale="scale" :layout="layout" :customColor="customColor">
		<slot />
	</Box>
</template>
