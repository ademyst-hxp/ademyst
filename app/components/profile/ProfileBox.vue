<script setup lang="ts">
import type { Profile } from "~~/shared/models/profiles";

import { PlusIcon, UserMinusIcon } from "@heroicons/vue/24/outline";

import ProfileRow from "./ProfileRow.vue";

const { $api } = useNuxtApp();
const { session } = useAuthSession();

const props = withDefaults(
	defineProps<{
		data: Profile;
		layout?: "vertical" | "horizontal";
		minified?: boolean;
	}>(),
	{
		layout: "vertical",
		minified: false,
	},
);

const profile = ref<Profile>(props.data);
const relationships = computed(() => profile.value.relationships);
const stats = computed(() => profile.value.stats);

const emits = defineEmits<{
	(e: "click"): void;
}>();
</script>
<template>
	<div class="flex items-center gap-2" v-if="minified">
		<ProfileRow :data="profile" />
		<slot />
	</div>
	<div
		v-else
		class="flex flex-col justify-end bg-cover bg-center rounded-4xl"
		:class="{
			'aspect-5/4': layout === 'horizontal',
			'aspect-4/5': layout === 'vertical',
		}"
		@click.self="$emit('click')"
		:style="{
			backgroundImage: `url('/api/v1/users/${profile.name}/avatar.webp')`,
		}"
	>
		<div
			class="flex flex-col justify-end gap-1 bg-linear-to-b from-black/0 via-black/10 to-black/60 text-white border-2 border-surface-border rounded-4xl w-full h-full p-6"
		>
			<div class="flex items-center gap-2 text-2xl font-semibold">
				{{ profile.displayName || `@${profile.name}` }}
				<img
					v-if="profile.badge"
					:src="`/api/v1/badges/${profile.badge?.id}/icon.png`"
					:alt="profile.badge?.name"
					class="shrink-0 h-5 w-5"
				/>
				<div class="grow" />
				<button
					v-if="profile.relationships.requested"
					class="flex items-center justify-center gap-0.5 bg-white/10 text-white text-sm border border-white/25 rounded-full pl-2 pr-3 py-1 duration-200 hover:bg-white/15"
				>
					Vous demande
				</button>

				<button
					v-if="relationships.requesting"
					class="flex items-center justify-center gap-0.5 bg-white/10 text-white text-sm border border-white/25 rounded-full pl-2 pr-3 py-1 duration-200 hover:bg-white/15"
				>
					En attente
				</button>

				<button
					v-if="relationships.followed"
					class="flex items-center justify-center gap-0.5 bg-white/10 text-white text-sm border border-white/25 rounded-full pl-2 pr-3 py-1 duration-200 hover:bg-white/15"
				>
					Vous suit
				</button>
			</div>
			<div class="flex items-center gap-2 opacity-75">
				<span
					><span class="font-semibold">{{
						toLitteral(stats.following)
					}}</span>
					suivis</span
				>
				<span>•</span>
				<span
					><span class="font-semibold">{{
						toLitteral(stats.followers)
					}}</span>
					abonnés</span
				>
			</div>
			<p v-if="profile.bio" class="text-sm opacity-50 line-clamp-2">
				{{ profile.bio }}
			</p>
		</div>
	</div>
</template>
