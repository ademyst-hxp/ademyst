<script setup lang="ts">
import Ring from "./Ring.vue";

const props = withDefaults(
	defineProps<{
		src?: string;
		color?: string[] | string | null;
		size?: "sm" | "md" | "lg" | "xl" | number;
	}>(),
	{
		src: "/images/default_avatar.png",
		color: null,
		size: "md",
	},
);

const sizes = {
	xs: 24,
	sm: 32,
	md: 48,
	lg: 64,
	xl: 96,
} as const;

const globalSize = computed<number>(() => {
	if (typeof props.size === "number") {
		return props.size;
	}

	return sizes[props.size ?? "md"];
});

const globalGradient = computed<string[]>(() => {
	if (props.color == null) {
		return [];
	} else if (Array.isArray(props.color)) {
		return props.color;
	} else if (typeof props.color === "string") {
		return [props.color, props.color];
	} else {
		return [];
	}
});
</script>
<template>
	<Ring :size="globalSize" :gradient="globalGradient">
		<img :src="src" class="w-full h-full object-cover rounded-full" />
	</Ring>
</template>
