<script setup lang="ts">
import type { Profile } from "~~/shared/models/profiles";

import ProfileRow from "./ProfileRow.vue";

import { PlusIcon, UserMinusIcon } from "@heroicons/vue/24/outline";

const { $api } = useNuxtApp();
const { session } = useAuthSession();

const props = withDefaults(defineProps<{
	data: Profile;
	minified?: boolean;
}>(), {
	minified: false,
});

const profile = ref<Profile>(props.data);
const relationships = computed(() => profile.value.relationships);
const stats = computed(() => profile.value.stats);

const refreshProfile = () => {
	$api<{ profile: Profile }>(`/api/v1/users/${profile.value.name}/`).then(
		(res) => {
			profile.value = res.profile;
		},
	);
};

const { followUser, unfollowUser } = useRelations();

const canFollow = computed(
	() =>
		session.value &&
		!relationships.value.me &&
		!relationships.value.following &&
		!relationships.value.blocking,
);
const canUnfollow = computed(
	() =>
		session.value &&
		!relationships.value.me &&
		relationships.value.following &&
		!relationships.value.blocking,
);

watch(
	() => props.data,
	(newData) => {
		profile.value = newData;
	},
);

const toggleFollow = async () => {
	if (canFollow.value) {
		profile.value.relationships.following = true;
		await followUser(profile.value.name, refreshProfile);
	} else if (canUnfollow.value) {
		profile.value.relationships.following = false;
		await unfollowUser(profile.value.name, refreshProfile);
	}
};
</script>
<template>
	<div class="flex items-center gap-2" v-if="minified">
		<ProfileRow :data="profile" />
		<slot />
	</div>
	<div
		v-else
		class="flex flex-col justify-end aspect-4/5 bg-cover bg-center rounded-4xl hover:scale-101 duration-200 ease-out transition-transform"
		@click.self="$emit('click')"
		:style="{
			backgroundImage: `url('/api/v1/users/${profile.name}/avatar.webp')`,
		}"
	>
		<div
			class="flex flex-col justify-end gap-1 bg-linear-to-b from-surface/0 via-surface/10 to-surface/60 text-surface-text border-2 border-surface-border rounded-4xl w-full h-full p-6"
		>
			<div class="flex items-center gap-2 text-2xl font-semibold">
				{{ profile.displayName || `@${profile.name}` }}
				<img
					v-if="profile.badge"
					:src="`/api/v1/badges/${profile.badge?.id}/icon.png`"
					:alt="profile.badge?.name"
					class="h-5 w-5"
				/>
				<div class="grow" />
				<button
					v-if="canFollow"
					@click="toggleFollow"
					class="flex items-center justify-center gap-0.5 bg-white/10 text-white text-sm border border-white/25 rounded-full pl-2 pr-3 py-1 duration-200 hover:bg-white/15"
				>
					<PlusIcon class="h-4 w-4" />
					Suivre
				</button>

				<button
					v-else-if="canUnfollow"
					@click="toggleFollow"
					class="flex items-center justify-center gap-0.5 bg-white/10 text-white text-sm border border-white/25 rounded-full pl-2 pr-3 py-1 duration-200 hover:bg-white/15"
				>
					<UserMinusIcon class="h-4 w-4" />
					Suivi(e)
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
