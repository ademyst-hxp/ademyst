<script setup lang="ts">
const props = withDefaults(defineProps<{
	scale?: "sm" | "md";
	layout?: "horizontal" | "vertical";
	customColor?: string;
}>(), {
	scale: "md",
	layout: "vertical",
});

const root = computed<{
	rootClass: string;
	rootStyle: Record<string, any>;
}>(() => {
	let rootClass =
		"flex backdrop-blur-lg text-surface-text border";

	switch (props.layout) {
		case "horizontal":
			rootClass += " flex-row";
			break;
		case "vertical":
		default:
			rootClass += " flex-col";
	}

	switch (props.scale) {
		case "sm":
			rootClass += " rounded-3xl gap-1 p-4 sm:p-6 sm:gap-1";
			break;
		case "md":
		default:
			rootClass += " rounded-4xl gap-2 p-6 sm:p-8 sm:gap-4";
	}

	return props.customColor
		? {
				rootClass,
				rootStyle: {
					backgroundColor: props.customColor,
					borderColor: "#00000020",
				},
			}
		: {
				rootClass: rootClass + " bg-surface border-surface-border",
				rootStyle: {},
			};
});
</script>
<template>
	<div :class="root.rootClass" :style="root.rootStyle">
		<slot />
	</div>
</template>
