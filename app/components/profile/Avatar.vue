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

const spacing = useState<number>("spacing") || ref<number>(3);

const sizes = {
	xs: 6 * spacing.value,
	sm: 8 * spacing.value,
	md: 12 * spacing.value,
	lg: 16 * spacing.value,
	xl: 24 * spacing.value,
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
