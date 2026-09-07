<script setup lang="ts">
import { InformationCircleIcon } from "@heroicons/vue/24/outline";

const props = withDefaults(
	defineProps<{
		title?: string;
		icon?: Component;
	}>(),
	{
		icon: InformationCircleIcon,
	},
);
</script>
<template>
	<div
		class="flex items-start gap-2 bg-info/15 text-info border border-info rounded-2xl p-4"
	>
		<div class="pt-2">
			<component v-if="icon" :is="icon" class="h-8 w-8" />
		</div>
		<div class="flex flex-col">
			<p v-if="title" class="font-semibold text-xl">{{ title }}</p>
			<p class="text-info/80">
				<slot />
			</p>
		</div>
	</div>
</template>
