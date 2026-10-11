<script setup lang="ts">
import { ExclamationTriangleIcon } from "@heroicons/vue/24/outline";

const props = withDefaults(
	defineProps<{
		title?: string;
		icon?: Component;
	}>(),
	{
		icon: ExclamationTriangleIcon,
	},
);
</script>
<template>
	<div
		class="flex items-start gap-2 bg-warning/15 text-warning border border-warning rounded-2xl p-4"
	>
		<div class="pt-2">
			<component v-if="icon" :is="icon" class="h-8 w-8" />
		</div>
		<div class="flex flex-col">
			<p v-if="title" class="font-semibold text-xl">{{ title }}</p>
			<p class="text-warning/80">
				<slot />
			</p>
		</div>
	</div>
</template>
