<script setup lang="ts">
import { BuildingOffice2Icon } from "@heroicons/vue/24/outline";
import { MapPinIcon } from "@heroicons/vue/24/solid";

import type { Profile } from "~~/shared/models/profiles";

import Box from "~/components/base/Box.vue";

type Relationship = {
	me: boolean;
	following: boolean;
	friend: boolean;
	blocked: boolean;
};

type ProfileResponse = {
	status: "ok" | "partial";
	data: Profile;
	stats: {
		following: number;
		followers: number;
		posts: number;
	};
	relationship: Relationship;
};

const route = useRoute();

const name = computed(() => {
	const rawName = route.params.name;
	return Array.isArray(rawName) ? rawName[0] : rawName;
});

const requestKey = computed(() => `profile-${name.value ?? "missing"}`);

const { data, pending, error, refresh } = await useAsyncData(
	requestKey,
	async () => {
		if (!name.value) {
			throw createError({
				statusCode: 400,
				statusMessage: "Missing username",
			});
		}

		return await $fetch<ProfileResponse>(
			`/api/v1/users/${encodeURIComponent(name.value)}`,
		);
	},
	{
		watch: [name],
		default: () => null,
	},
);

const profile = computed(() => data.value?.data ?? null);
const stats = computed(
	() => data.value?.stats ?? { following: 0, followers: 0, posts: 0 },
);
const relationship = computed<Relationship>(
	() =>
		data.value?.relationship ?? {
			me: false,
			following: false,
			friend: false,
			blocked: false,
		},
);
const isMe = computed(() => relationship.value.me);
const canFollow = computed(
	() =>
		!relationship.value.me &&
		!relationship.value.following &&
		!relationship.value.blocked,
);

useHead(() => {
	const profileName =
		profile.value?.displayName ??
		(profile.value?.name ? `@${profile.value.name}` : "Profil");

	return {
		title: `${profileName} | Beam: Revolved`,
		meta: [
			{
				name: "description",
				content:
					profile.value?.bio ?? `${profileName} sur Beam: Revolved.`,
			},
		],
	};
});

const tab = ref<string>("posts");
</script>
<template>
	<div class="lg:flex">
		<header class="p-6 lg:w-1/2 xl:w-1/3 md:p-8">
			<Box>
				<div class="flex gap-4 items-center">
					<img
						src="/images/default_avatar.png"
						class="w-24 h-24 rounded-full"
					/>
					<div class="-space-y-2">
						<div
							class="bg-muted rounded-full h-3 animate-pulse"
							v-if="pending"
						></div>
						<h1 v-else class="text-3xl font-bold">
							{{
								profile?.displayName ??
								(profile?.name ? `@${profile?.name}` : "Ghost")
							}}
						</h1>

						<div
							class="bg-muted rounded-full h-3 w-1/2 animate-pulse"
							v-if="pending"
						></div>
						<span v-else class="text-muted text-lg font-semibold">
							{{ `@${profile?.name ?? "ghost"}` }}
						</span>
					</div>
				</div>
				<div class="flex items-center gap-4 px-4">
					<div class="grow flex flex-col w-1/3 -space-y-1">
						<span class="text-2xl font-bold">{{
							stats.following
						}}</span>
						<span class="text-muted">Suivis</span>
					</div>
					<div class="grow flex flex-col w-1/3 -space-y-1">
						<span class="text-2xl font-bold">{{
							stats.followers
						}}</span>
						<span class="text-muted">Abonnés</span>
					</div>
					<div class="grow flex flex-col w-1/3 -space-y-1">
						<span class="text-2xl font-bold">{{
							stats.posts
						}}</span>
						<span class="text-muted">Posts</span>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<Button
						v-if="isMe"
						label="Modifier le profil"
						size="medium"
						handler="/account/edit"
					/>

					<Button
						v-if="canFollow"
						label="Suivre"
						size="medium"
						handler="#"
					/>
					<Button
						v-else-if="relationship.following"
						label="Abonné"
						variant="danger"
						size="medium"
						handler="#"
					/>

					<Button
						v-if="relationship.blocked"
						label="Débloquer"
						variant="danger"
						size="medium"
						handler="#"
					/>
					<Button
						v-else
						label="Bloquer"
						variant="danger"
						size="medium"
						handler="#"
					/>
				</div>
				<p class="text-muted px-4" v-if="profile?.bio">
					{{ profile.bio }}
				</p>
				<ul v-if="profile?.location || profile?.corporation" class="px-4">
					<li class="flex items-center gap-1" v-if="profile.location">
						<MapPinIcon class="text-muted w-5 h-5" />
						{{ profile.location }}
					</li>
					<li class="flex items-center gap-1" v-if="profile.corporation">
						<BuildingOffice2Icon class="text-muted w-5 h-5" />
						{{ profile.corporation }}
					</li>
				</ul>
			</Box>
		</header>
		<main class="lg:w-1/2 xl:w-2/3 md:p-8">
			<div class="lg:flex lg:justify-end">
				<div class="lg:grow"></div>
				<TabBar
					:tabs="[
						{ name: 'Publications', value: 'posts' },
						{ name: 'Status', value: 'status' },
					]"
					v-model="tab"
				/>
			</div>
		</main>
	</div>
</template>
