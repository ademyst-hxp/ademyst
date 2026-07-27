<script setup lang="ts">
import Navbar from "~/components/layout/Navbar.vue";
import PostBox from "~/components/interactions/Post.vue";
import Menu from "~/components/Menu.vue";

import {
	GlobeAltIcon,
	RocketLaunchIcon,
	UserGroupIcon,
	HeartIcon,
	EyeSlashIcon,
} from "@heroicons/vue/24/outline";

import type { Post } from "~~/shared/models/interactions";
import Box from "~/components/base/Box.vue";

const { $api } = useNuxtApp();
const { session, refresh } = useAuthSession();
await refresh();

if (!session.value) {
	navigateTo("/auth/login");
}

definePageMeta({
	title: "Écrire un post | Beam",
	description:
		"Exprimez-vous et partagez vos idées avec la communauté Beam en écrivant un post.",
	middleware: ["auth"],
});

useHead({
	title: "Écrire un post | Beam",
	meta: [
		{
			name: "description",
			content:
				"Exprimez-vous et partagez vos idées avec la communauté Beam en écrivant un post.",
		},
		{
			name: "keywords",
			content: "Beam, Revolved, Discover",
		},
		{
			name: "author",
			content: "Ejnalo",
		},
		{
			name: "viewport",
			content: "width=device-width, initial-scale=1.0",
		},
	],
});

const isPrev = ref<boolean>(false);

const preparingPost = ref<Post>({
	id: "0",
	profile: session.value!.profile,
	parentId: null,
	visibility: "everyone",
	content: "",
	createdAt: new Date(),
	attachments: [],
	flags: [],
	stats: {
		reactions: {
			like: 0,
		},
		answers: 0,
	},
});

const isVisibilityMenuOpen = ref(false);

const visibilityLabels: Record<string, string> = {
	outside: "Essai (extérieur)",
	everyone: "Tout le monde",
	followers: "Abonnés",
	friends: "Amis",
	me: "Privé",
};

const isInLimit = computed(() => {
	return preparingPost.value.content.length <= 5000;
});

const isGood = computed(() => {
	return preparingPost.value.content.length > 0 && isInLimit.value;
});

const handlePublish = async () => {
	if (!isGood.value) return;

	try {
		await $api("/posts/new", { method: "POST", body: preparingPost.value });
		await navigateTo("/discover");
	} catch (error) {
		console.error("Erreur lors de la publication du post:", error);
	}
};
</script>
<template>
	<div class="md:flex">
		<aside class="basis-1/4 max-xl:hidden">
			<!-- Vide -->
		</aside>
		<section
			class="basis-2/3 flex flex-col gap-4 overflow-y-auto p-4 max-md:order-0 md:p-8 xl:basis-2/4"
		>
			<header class="flex flex-col gap-4">
				<h1 class="text-2xl font-bold px-8">Écrire une publication</h1>
				<div class="flex flex-col gap-2 px-8">
					<Input
						v-model="isPrev"
						label="Prévisualiser la publication"
						type="checkbox"
					/>
					<p>
						Visibilité:
						<b>{{ visibilityLabels[preparingPost.visibility] }}</b>
						(<u
							class="cursor-pointer text-primary underline"
							@click="isVisibilityMenuOpen = true"
							>Changer</u
						>)
					</p>
				</div>
			</header>
			<main class="flex flex-col gap-4 overflow-visible">
				<PostBox :data="preparingPost" :editable="!isPrev" />
				<section class="flex flex-col gap-2 px-8">
					<Button
						label="Publier"
						variant="primary"
						:disabled="!isGood"
						:handler="handlePublish"
					/>
				</section>
			</main>
		</section>
		<aside
			class="basis-1/4 sticky top-24 flex flex-col gap-4 overflow-y-auto p-4 max-md:order-0 md:p-8 max-xl:hidden"
		>
			<!-- Profils -->
		</aside>
	</div>
	<Menu
		v-if="isVisibilityMenuOpen"
		@close="isVisibilityMenuOpen = false"
		:title="'Visibilité de la publication'"
		:actions="[
			{
				label: 'Essai',
				description: 'Tout le monde sauf vos abonnés',
				icon: RocketLaunchIcon,
				handler: () => {
					preparingPost.visibility = 'outside';
				},
			},
			{
				label: 'Tout le monde',
				icon: GlobeAltIcon,
				handler: () => {
					preparingPost.visibility = 'everyone';
				},
			},
			{
				label: 'Abonnés',
				icon: UserGroupIcon,
				handler: () => {
					preparingPost.visibility = 'followers';
				},
			},
			{
				label: 'Amis',
				icon: HeartIcon,
				handler: () => {
					preparingPost.visibility = 'friends';
				},
			},
			{
				label: 'Privé',
				icon: EyeSlashIcon,
				handler: () => {
					preparingPost.visibility = 'me';
				},
			},
		]"
	/>
</template>
