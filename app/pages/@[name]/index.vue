<script setup lang="ts">
import { BuildingOffice2Icon, MapPinIcon } from "@heroicons/vue/24/solid";

import Navbar from "~/components/layout/Navbar.vue";
import PostView from "@/components/interactions/Post.vue";

import type { Profile } from "~~/shared/models/profiles";
import type { Post } from "~~/shared/models/interactions";

type Relationship = {
	me: boolean;
	following: boolean;
	followed: boolean;
	friend: boolean;
	blocking: boolean;
};

type ProfileResponse = {
	status: "ok";
	profile: Profile;
};

const route = useRoute();
const { $api } = useNuxtApp();

const { followUser, unfollowUser, friendUser, unfriendUser } = useRelations();

const name = computed(() => {
	const raw = route.params.name;
	return Array.isArray(raw) ? raw[0] : raw;
});

const requestKey = computed(() => `profile-${name.value ?? "missing"}`);
const postsRequestKey = computed(() => `posts-${name.value ?? "missing"}`);

const { data, pending } = await useAsyncData(requestKey, async () => {
	if (!name.value) throw createError({ statusCode: 400 });

	return $api<ProfileResponse>(`/users/${encodeURIComponent(name.value)}`);
});

const { data: posts } = await useAsyncData(postsRequestKey, async () => {
	if (!name.value) throw createError({ statusCode: 400 });

	return (
		await $api<{ posts: Post[] }>(
			`/users/${encodeURIComponent(name.value)}/posts`,
		)
	).posts;
});

const profile = computed(() => data.value?.profile ?? null);
const stats = computed(
	() => profile.value?.stats ?? { following: 0, followers: 0 },
);
const relationship = computed<Relationship>(
	() =>
		data.value?.profile.relationships ?? {
			me: false,
			following: false,
			followed: false,
			friend: false,
			blocking: false,
		},
);

const isMe = computed(() => relationship.value.me);
const canFollow = computed(
	() =>
		!relationship.value.me &&
		!relationship.value.following &&
		!relationship.value.blocking,
);

const tab = ref("posts");

const tabs = computed<{ name: string; value: string }[]>(() => {
	let _tabs = [
		{ name: "Publications", value: "posts" },
		{ name: "Pensées", value: "whispers" },
		{ name: "Suivis", value: "follows" },
		{ name: "Abonnés", value: "followers" },
	];

	if (relationship.value.me) {
		_tabs.splice(2, 0, { name: "Collections", value: "collections" });
		_tabs.push({ name: "Statistiques", value: "stats" });
	}

	return _tabs;
});
</script>
<template>
	<div class="mx-auto max-w-7xl lg:flex lg:gap-8">
		<header
			class="p-6 px-8 space-y-6 md:p-8 lg:w-1/2 xl:w-1/3 lg:sticky lg:top-24 lg:self-start"
		>
			<div class="flex gap-4 items-center">
				<img
					:src="`/api/v1/users/${profile?.name}/avatar.webp`"
					class="w-24 h-24 rounded-full"
				/>

				<div class="-space-y-2">
					<div
						v-if="pending"
						class="bg-muted rounded-full h-3 w-32 animate-pulse"
					/>

					<h1 v-else class="text-3xl font-bold">
						{{
							profile?.displayName ??
							(profile?.name ? `@${profile.name}` : "Ghost")
						}}
					</h1>

					<div
						v-if="pending"
						class="bg-muted rounded-full h-3 w-24 animate-pulse"
					/>

					<span v-else class="text-muted text-lg font-semibold">
						{{ `@${profile?.name ?? "ghost"}` }}
					</span>
				</div>
			</div>

			<div class="flex items-center gap-4 px-4">
				<div class="flex flex-col w-1/3 -space-y-1">
					<span class="text-2xl font-bold">{{
						posts?.length ?? 0
					}}</span>
					<span class="text-muted">Publications</span>
				</div>

				<div class="flex flex-col w-1/3 -space-y-1">
					<span class="text-2xl font-bold">{{
						stats.following
					}}</span>
					<span class="text-muted">Suivis</span>
				</div>

				<div class="flex flex-col w-1/3 -space-y-1">
					<span class="text-2xl font-bold">{{
						stats.followers
					}}</span>
					<span class="text-muted">Abonnés</span>
				</div>
			</div>

			<div v-if="profile" class="flex flex-wrap gap-2">
				<Button
					v-if="isMe"
					label="Modifier le profil"
					size="medium"
					handler="/account/edit"
				/>

				<Button
					v-if="relationship.friend"
					label="Supprimer un ami"
					variant="danger"
					size="medium"
					:handler="
						() =>
							unfriendUser(profile!.name, () => {
								relationship.friend = false;
							})
					"
				/>

				<Button
					v-else-if="relationship.following"
					label="Ajouter en ami"
					variant="success"
					size="medium"
					:handler="
						() =>
							friendUser(profile!.name, () => {
								relationship.friend = true;
							})
					"
				/>

				<Button
					v-if="canFollow"
					label="Suivre"
					size="medium"
					:handler="
						() =>
							followUser(profile!.name, () => {
								relationship.following = true;
							})
					"
				/>

				<Button
					v-else-if="relationship.following"
					label="Se désabonner"
					variant="danger"
					size="medium"
					:handler="
						() =>
							unfollowUser(profile!.name, () => {
								relationship.following = false;
							})
					"
				/>
			</div>

			<p v-if="profile?.bio" class="text-muted px-4">
				{{ profile.bio }}
			</p>

			<ul
				v-if="profile?.location || profile?.corporation"
				class="space-y-1 px-4"
			>
				<li v-if="profile.location" class="flex items-center gap-1">
					<MapPinIcon class="w-5 h-5 text-muted" />
					{{ profile.location }}
				</li>

				<li v-if="profile.corporation" class="flex items-center gap-1">
					<BuildingOffice2Icon class="w-5 h-5 text-muted" />
					{{ profile.corporation }}
				</li>
			</ul>
		</header>
		<main
			class="flex flex-col gap-4 max-lg:p-4 lg:w-1/2 xl:w-2/3 md:p-8 min-w-0"
		>
			<div class="lg:flex lg:justify-end">
				<TabBar v-model="tab" :tabs="tabs" />
			</div>

			<section v-if="tab === 'posts'" class="space-y-4">
				<PostView
					v-for="post in posts ?? []"
					:key="post.id"
					:data="post"
				/>
			</section>
		</main>
	</div>
</template>
