<script setup lang="ts">
import type { Whisper } from "~~/shared/models/interactions";

import Box from "../base/Box.vue";
import Avatar from "../profile/Avatar.vue";
import WhisperIcon from "~/assets/whispers.svg";

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
	<div
		:key="`whisper-${data.id}`"
		:style="{
			borderColor: data.color ? '#00000040' : undefined,
			backgroundColor: data.color || undefined,
			backgroundImage: data.image ? `url(${data.image})` : undefined,
			backgroundSize: data.image ? 'cover' : undefined,
			backgroundPosition: data.image ? 'center' : undefined,
			aspectRatio: data.image ? '5/2' : undefined,
		}"
		class="shrink-0 bg-whispers-text text-whispers border-2 border-whispers overflow-hidden"
		:class="
			minified
				? 'rounded-3xl rounded-bl-2xl w-48 cursor-pointer transition-all duration-150 hover:scale-97'
				: 'rounded-4xl rounded-bl-3xl w-full sm:w-lg'
		"
		:scale="minified ? 'sm' : 'md'"
	>
		<div
			class="flex items-center p-4 h-full"
			:class="{
				'bg-whispers-text/60': !!data.image,
				'flex-col justify-center p-8': !minified,
				'px-4 py-2': minified,
			}"
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

			<div
				v-if="!minified && slots.actions"
				class="flex items-center gap-2"
			>
				<slot name="actions" />
			</div>
		</div>
	</div>
</template>
