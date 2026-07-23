<script setup lang="ts">
import { computed, useId } from "vue";

interface Props {
	size?: number;
	gradient?: string[];
}

const props = withDefaults(defineProps<Props>(), {
	size: 64,
	gradient: () => [],
});

const hasGradient = computed(() => props.gradient.length >= 2);

const ringWidth = computed(() => (hasGradient.value ? 6 : 0));
const gap = computed(() => (hasGradient.value ? 6 : 0));

const imageInset = computed(() => ringWidth.value + gap.value);

const gradientId = `avatar-gradient-${useId()}`;
const clipId = `avatar-clip-${useId()}`;
</script>

<template>
	<svg
		:width="size"
		:height="size"
		viewBox="0 0 100 100"
		xmlns="http://www.w3.org/2000/svg"
	>
		<defs>
			<linearGradient
				v-if="hasGradient"
				:id="gradientId"
				x1="0%"
				y1="0%"
				x2="100%"
				y2="100%"
			>
				<stop
					v-for="(color, index) in gradient"
					:key="color"
					:offset="`${(index / (gradient.length - 1)) * 100}%`"
					:stop-color="color"
				/>
			</linearGradient>

			<clipPath :id="clipId">
				<circle cx="50" cy="50" :r="50 - imageInset" />
			</clipPath>
		</defs>

		<circle
			v-if="hasGradient"
			cx="50"
			cy="50"
			:r="50 - ringWidth / 2"
			fill="none"
			:stroke="`url(#${gradientId})`"
			:stroke-width="ringWidth"
		/>

		<foreignObject
			:x="imageInset"
			:y="imageInset"
			:width="100 - imageInset * 2"
			:height="100 - imageInset * 2"
			:clip-path="`url(#${clipId})`"
		>
			<slot />
		</foreignObject>
	</svg>
</template>
