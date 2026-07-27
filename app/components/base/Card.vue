<script setup lang="ts">
const props = defineProps<{
	scale?: "sm" | "md";
	customColor?: string;
}>();

const root = computed<{
	rootClass: string;
	rootStyle: Record<string, any>;
}>(() => {
	let rootClass =
		"flex flex-col backdrop-blur-lg text-widget-text border";

	switch (props.scale) {
		case "sm":
			rootClass += " rounded-xl gap-1 p-2 sm:p-4 sm:gap-2";
			break;
		case "md":
		default:
			rootClass += " rounded-2xl gap-2 p-4 sm:p-6 sm:gap-4";
	}

	return props.customColor
		? {
				rootClass,
				rootStyle: {
					backgroundColor: props.customColor,
					borderColor: "#00000040",
				},
			}
		: {
				rootClass: rootClass + " bg-widget border-widget-border",
				rootStyle: {},
			};
});
</script>
<template>
	<div :class="root.rootClass" :style="root.rootStyle">
		<slot />
	</div>
</template>
