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

const root = computed<{
	rootClass: string;
	rootStyle: Record<string, any>;
}>(() => {
	const divider = "divide-surface-border";

	let rootClass = "flex backdrop-blur-lg border";

	switch (props.layout) {
		case "horizontal":
			rootClass += " flex-row";
			break;
		case "vertical":
		default:
			rootClass += " flex-col";
			break;
		case "horizontal-divide":
			rootClass += ` flex-row divide-x ${divider}`;
			break;
		case "vertical-divide":
			rootClass += ` flex-col divide-y ${divider}`;
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

	if (props.customColor) {
		return {
			rootClass: rootClass + " text-surface-text",
			rootStyle: {
				backgroundColor: props.customColor,
				borderColor: "#00000020",
			},
		};
	}

	return {
		rootClass:
			rootClass +
			" text-surface-text bg-surface border-surface-border",
		rootStyle: {},
	};
});
</script>
<template>
	<div :class="root.rootClass" :style="root.rootStyle">
		<slot />
	</div>
</template>
