<script setup lang="ts">
import Ghost from "~/assets/illustrations/ghost.svg";

const props = withDefaults(defineProps<{
	title?: string;
	message?: string;
	illustration?: Component;
}>(), {
	title: "No data",
	message: "There is no data to display.",
});
</script>
<template>
	<div class="flex flex-col gap-4">
		<component
			:is="illustration ?? Ghost"
			class="w-32 h-32 mx-auto"
		/>
		<h2 class="text-2xl font-bold font-title text-center">{{ title }}</h2>
		<p class="text-muted text-center">{{ message }}</p>
	</div>
</template>
