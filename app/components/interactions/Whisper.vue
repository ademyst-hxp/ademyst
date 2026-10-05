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

const author = computed(
	() =>
		props.data.profile.displayName ||
		`@${props.data.profile.name}` ||
		"@ghost",
);

const signature = computed(
	() =>
		`${props.data.textColor ? "" : "~"}${props.data.profile.displayName || props.data.profile.name || "ghost"} à ${new Date(
			props.data.createdAt,
		).toLocaleTimeString("fr-FR", {
			hour: "2-digit",
			minute: "2-digit",
		})}`,
);

const textClass = computed(() =>
	props.data.textColor ? "text-inherit" : "text-white font-serif",
);
</script>
<template>
	<Box
		:key="`whisper-${data.id}`"
		:customColor="data.color || undefined"
		class="shrink-0 bg-whispers-text text-whispers border-2 border-whispers justify-center"
		:class="
			minified
				? 'w-48 cursor-pointer transition-all duration-150 hover:scale-97'
				: 'w-full sm:w-lg'
		"
		:scale="minified ? 'sm' : 'md'"
	>
		<WhisperIcon
			v-if="!minified"
			class="self-center h-6 w-auto"
			:style="{ color: data.textColor || 'inherit' }"
		/>

		<div
			class="flex"
			:class="
				minified
					? 'items-start gap-2'
					: 'flex-col items-center -space-y-1'
			"
			:style="{ color: data.textColor || 'inherit' }"
		>
			<Avatar
				v-if="minified"
				size="sm"
				class="shrink-0 mt-1.5"
				:src="`/api/v1/users/${data.profile.name}/avatar.webp`"
			/>

			<div
				class="grow flex flex-col -space-y-1"
				:class="minified ? '' : 'items-center'"
			>
				<h3 v-if="minified" class="font-title opacity-75">
					{{ author }}
				</h3>

				<textarea
					v-if="editable"
					v-model="data.content"
					placeholder="Exprimez-vous..."
					class="bg-transparent resize-none outline-none"
					:class="[
						minified
							? 'w-full break-all wrap-anywhere line-clamp-1'
							: 'w-fit text-xl text-center',
						textClass,
					]"
				/>

				<p
					v-else
					class="text-lg"
					:class="[
						minified
							? 'break-all wrap-anywhere line-clamp-1'
							: 'text-xl text-center',
						textClass,
					]"
				>
					{{ data.content }}
				</p>

				<span v-if="!minified" class="italic opacity-75 w-fit">
					{{ signature }}
				</span>
			</div>
		</div>

		<div v-if="!minified && slots.actions" class="flex items-center gap-2">
			<slot name="actions" />
		</div>
	</Box>
</template>
