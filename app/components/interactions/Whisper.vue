<script setup lang="ts">
import type { Whisper } from "~~/shared/models/interactions";

import Box from "../base/Box.vue";

import Avatar from "../profile/Avatar.vue";

const props = defineProps<{
	data: Whisper;
	minified?: boolean;
	editable?: boolean;
}>();

const slots = defineSlots<{
	actions: () => void;
}>();
</script>
<template>
	<Box
		:key="'whisper-' + data.id"
		:customColor="data.color || undefined"
		class="shrink-0"
		:class="
			minified
				? 'w-48 cursor-pointer transition-all duration-150 hover:scale-97'
				: 'w-full sm:w-lg'
		"
		:scale="minified ? 'sm' : 'md'"
	>
		<div class="flex items-start gap-2">
			<Avatar size="sm" class="shrink-0 mt-1.5" />
			<div
				class="grow flex flex-col -space-y-1"
				:style="{ color: data.textColor || 'inherit' }"
			>
				<h3 class="opacity-75">
					{{
						data.profile.displayName ||
						`@${data.profile.name}` ||
						"@ghost"
					}}
					<span v-if="!minified">
						|
						{{
							new Date(data.createdAt).toLocaleTimeString("fr-FR", {
								hour: "2-digit",
								minute: "2-digit",
							})
						}}</span
					>
				</h3>
				<textarea
					v-if="editable"
					v-model="data.content"
					placeholder="Exprimez-vous..."
					class="w-full bg-transparent resize-none outline-none"
					:class="
						minified ? 'break-all wrap-anywhere line-clamp-1' : ''
					"
				></textarea>
				<p
					v-else
					class="text-lg"
					:class="
						minified ? ' break-all wrap-anywhere line-clamp-1' : ''
					"
				>
					{{ data.content }}
				</p>
			</div>
		</div>
		<div v-if="!minified && slots.actions" class="flex items-center gap-2">
			<slot name="actions" />
		</div>
	</Box>
</template>
