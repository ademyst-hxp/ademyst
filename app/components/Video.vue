<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		src: string;
		poster?: string;
		controls?: boolean;
		autoplay?: boolean;
		loop?: boolean;
		muted?: boolean;
		preload?: "none" | "metadata" | "auto";
	}>(),
	{
		controls: true,
		autoplay: false,
		loop: false,
		muted: false,
		preload: "metadata",
	},
);

const emit = defineEmits<{
	(e: "load"): void;
	(e: "error"): void;
}>();
</script>
<template>
	<video
		:src="props.src"
		:poster="props.poster"
		:controls="props.controls"
		:autoplay="props.autoplay"
		:loop="props.loop"
		:muted="props.muted"
		:preload="props.preload"
		playsinline
		@loadeddata="emit('load')"
		@error="emit('error')"
	/>
</template>
