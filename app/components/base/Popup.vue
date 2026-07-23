<script setup lang="ts">
const emit = defineEmits<{
	(e: "close"): void;
}>();

const close = () => {
	emit("close");
};
</script>
<template>
	<Teleport to="body">
		<div
			@click.self="close"
			class="fixed top-0 left-0 flex flex-col items-center justify-end gap-4 w-screen h-screen bg-black/50 backdrop-blur-sm z-4000 p-8 sm:justify-center"
		>
			<slot />
		</div>
	</Teleport>
</template>
