
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
		class="flex flex-col justify-end bg-cover bg-center rounded-4xl"
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
			class="flex flex-col justify-end gap-2 bg-linear-to-b from-black/0 via-black/10 to-black/60 text-white border-2 border-surface-border rounded-4xl w-full h-full p-6"
		>
			<div class="flex items-center gap-2">
				<input
					v-model="profile.displayName"
					:placeholder="`@${profile.name}`"
					class="min-w-0 grow bg-transparent text-2xl font-semibold outline-none placeholder:text-white/60"
					@click.stop
				/>

				<img
					v-if="profile.badge"
					:src="`/api/v1/badges/${profile.badge.id}/icon.png`"
					:alt="profile.badge.name"
					class="shrink-0 h-5 w-5"
				/>
			</div>

			<p v-if="profile.bio" class="text-sm opacity-50 line-clamp-2">
				{{ profile.bio }}
			</p>
		</div>
	</div>
</template>
