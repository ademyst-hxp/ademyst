<script setup lang="ts">
import type { Whisper } from "~~/shared/models/interactions";

import Box from "../base/Box.vue";

import Avatar from "../profile/Avatar.vue";

const props = defineProps<{
	data: Whisper;
	minified?: boolean
}>();
</script>
<template>
	<Box
		:key="'whisper-' + data.id"
		:customColor="data.color || undefined"
		class="shrink-0"
		:class="minified ? 'w-48 cursor-pointer transition-all duration-150 hover:scale-97' : 'w-full sm:w-lg'"
		:scale="minified ? 'sm' : 'md'"
	>
		<div class="flex items-start gap-2">
			<Avatar size="sm" class="shrink-0 mt-1.5" />
			<div class="grow flex flex-col -space-y-1" :style="{ color: data.textColor || 'inherit' }">
				<h3 class="opacity-75">{{ data.profile.displayName || `@${data.profile.name}` || '@ghost' }}</h3>
				<p class="text-lg" :class="minified ? ' break-all wrap-anywhere line-clamp-1' : ''">
					{{ data.content }}
				</p>
			</div>
		</div>
	</Box>
</template>
