<script setup lang="ts">
import Box from "~/components/base/Box.vue";
import { ChevronRightIcon } from "@heroicons/vue/24/outline";

const props = withDefaults(
	defineProps<{
		scale?: "sm" | "md";
		layout?: "horizontal" | "vertical";
		actions: {
			label: string;
			icon?: Component | string;
			indicator?: string;
			handler: (() => void | Promise<void>) | string;
		}[];
	}>(),
	{
		scale: "md",
		layout: "vertical",
	},
);

const handleAction = (handler: (() => void | Promise<void>) | string) => {
	if (typeof handler === "string") {
		navigateTo(handler);
	} else {
		handler();
	}
};
</script>
<template>
	<Box
		:scale="scale"
		:layout="
			(layout + '-divide') as 'horizontal-divide' | 'vertical-divide'
		"
	>
		<div
			v-for="action in actions"
			:key="`action-${action.label}`"
			class="flex items-center justify-center gap-2 cursor-pointer hover:bg-surface-hover transition-colors duration-200"
			:class="scale == 'sm' ? 'p-4 sm:p-6' : 'p-6 sm:p-8'"
			@click="handleAction(action.handler)"
		>
			<img
				v-if="action.icon && typeof action.icon === 'string'"
				:src="action.icon"
				class="h-8 w-8"
			/>
			<component
				v-else-if="action.icon"
				:is="action.icon"
				class="h-8 w-8"
			/>
			<p class="grow text-lg font-medium">{{ action.label }}</p>
			<p
				v-if="action.indicator"
				class="text-sm text-surface-text-muted max-w-1/4 truncate"
			>
				{{ action.indicator }}
			</p>
			<ChevronRightIcon class="text-surface-text-muted h-5 w-5" />
		</div>
	</Box>
</template>
