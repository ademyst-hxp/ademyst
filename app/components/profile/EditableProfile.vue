
<script setup lang="ts">
import type { Profile } from "~~/shared/models/profiles";

import ProfileRow from "./ProfileRow.vue";

const profile = defineModel<Profile>({ required: true });

const props = withDefaults(
	defineProps<{
		layout?: "vertical" | "horizontal";
		minified?: boolean;
	}>(),
	{
		layout: "vertical",
		minified: false,
	},
);

const emits = defineEmits<{
	(e: "click"): void;
}>();
</script>

<template>
	<div v-if="minified" class="flex items-center gap-2">
		<ProfileRow :data="profile" />
		<slot />
	</div>

	<div
		v-else
		class="flex flex-col justify-end bg-cover bg-center rounded-4xl hover:scale-101 duration-200 ease-out transition-transform"
		:class="{
			'aspect-5/4': props.layout === 'horizontal',
			'aspect-4/5': props.layout === 'vertical',
		}"
		@click.self="emits('click')"
		:style="{
			backgroundImage: `url('/api/v1/users/${profile.name}/avatar.webp')`,
		}"
	>
		<div
			class="flex flex-col justify-end gap-2 bg-linear-to-b from-surface/0 via-surface/10 to-surface/60 text-surface-text border-2 border-surface-border rounded-4xl w-full h-full p-6"
		>
			<div class="flex items-center gap-2">
				<input
					v-model="profile.displayName"
					:placeholder="`@${profile.name}`"
					class="min-w-0 grow bg-transparent text-2xl font-semibold outline-none placeholder:text-surface-text/60"
					@click.stop
				/>

				<img
					v-if="profile.badge"
					:src="`/api/v1/badges/${profile.badge.id}/icon.png`"
					:alt="profile.badge.name"
					class="shrink-0 h-5 w-5"
				/>
			</div>

			<textarea
				v-model="profile.bio"
				placeholder="Ajouter une biographie..."
				rows="2"
				class="w-full resize-none bg-transparent text-sm opacity-75 outline-none placeholder:text-surface-text/50"
				@click.stop
			/>
		</div>
	</div>
</template>
