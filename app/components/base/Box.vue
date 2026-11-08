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

const root = computed<{
	rootClass: string;
	rootStyle: Record<string, any>;
}>(() => {
	let rootClass = "flex backdrop-blur-lg text-surface-text border";

	switch (props.layout) {
		case "horizontal":
			rootClass += " flex-row";
			break;
		case "vertical":
		default:
			rootClass += " flex-col";
			break;
		case "horizontal-divide":
			rootClass += " flex-row divide-x divide-surface-border";
			break;
		case "vertical-divide":
			rootClass += " flex-col divide-y divide-surface-border";
			break;
	}

	switch (props.scale) {
		case "sm":
			rootClass += " rounded-2xl";
			if (!props.layout.includes("divide")) {
				rootClass += " gap-2 p-3 sm:p-4 sm:gap-3";
			}
			break;
		case "md":
		default:
			rootClass += " rounded-3xl";
			if (!props.layout.includes("divide")) {
				rootClass += " gap-3 p-4 sm:p-6 sm:gap-4";
			}
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
