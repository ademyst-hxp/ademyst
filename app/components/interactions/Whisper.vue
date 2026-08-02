<script setup lang="ts">
import WhisperIcon from "~/assets/whispers.svg";

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
		class="shrink-0 bg-whispers-text text-whispers"
		:class="
			minified
				? 'w-48 cursor-pointer transition-all duration-150 hover:scale-97'
				: ' w-full sm:w-lg'
		"
		:scale="minified ? 'sm' : 'md'"
	>
		<WhisperIcon
			v-if="!minified"
			class="self-center w-auto h-6"
			:style="{ color: data.textColor || 'inherit' }"
		/>
		<div
			v-if="minified"
			class="flex items-start gap-2"
			:style="{ color: data.textColor || 'inherit' }"
		>
			<Avatar size="sm" class="shrink-0 mt-1.5" />
			<div class="grow flex flex-col -space-y-1">
				<h3 class="opacity-75">
					{{
						data.profile.displayName ||
						`@${data.profile.name}` ||
						"@ghost"
					}}
				</h3>
				<textarea
					v-if="editable"
					v-model="data.content"
					placeholder="Exprimez-vous..."
					class="w-full bg-transparent resize-none outline-none"
					:class="
						(minified
							? ' break-all wrap-anywhere line-clamp-1'
							: '') +
						(data.textColor ? ' text-inherit' : ' text-white')
					"
				></textarea>
				<p
					v-else
					class="text-lg"
					:class="
						(minified
							? ' break-all wrap-anywhere line-clamp-1'
							: '') +
						(data.textColor ? ' text-inherit' : ' text-white')
					"
				>
					{{ data.content }}
				</p>
			</div>
		</div>
		<div
			v-else
			class="flex flex-col items-center gap-2"
			:style="{ color: data.textColor || 'inherit' }"
		>
			<textarea
				v-if="editable"
				v-model="data.content"
				placeholder="Exprimez-vous..."
				class="w-fit text-xl text-center bg-transparent resize-none outline-none"
				:class="data.textColor ? ' text-inherit' : ' text-white'"
			></textarea>
			<p
				v-else
				class="text-xl text-center"
				:class="data.textColor ? ' text-inherit' : ' text-white'"
			>
				{{ data.content }}
			</p>
			<div class="grow flex items-center gap-2">
				<h3 class="italic opacity-75">
					~{{
						data.profile.displayName ||
						data.profile.name ||
						"ghost"
					}} à {{ new Date(data.createdAt).toLocaleTimeString("fr-FR", {
						hour: "2-digit",
						minute: "2-digit",
					}) }}
				</h3>
			</div>
		</div>
		<div v-if="!minified && slots.actions" class="flex items-center gap-2">
			<slot name="actions" />
		</div>
	</Box>
</template>
