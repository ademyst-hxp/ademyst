<script setup lang="ts">
import Navbar from "~/components/layout/Navbar.vue";
import PostBox from "~/components/interactions/Post.vue";

import type { Post } from "~~/shared/models/interactions";

import {
	ArrowLeftIcon,
	ArrowRightIcon,
	PlusCircleIcon,
	UserIcon,
	PaperAirplaneIcon,
	NoSymbolIcon,
} from "@heroicons/vue/24/solid";

import type { Status } from "~~/shared/models/interactions";

const { session, refresh: refreshSession } = useAuthSession();
const { statuses, posts, users, refresh } = useFeed();
const { blockUser } = useRelations();

await refresh();

await refreshSession();

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
</script>
<template>
	<Navbar />
	<div class="md:flex">
		<aside class="basis-1/4 max-xl:hidden">
			<!-- Vide -->
		</aside>
		<section
			class="basis-2/3 flex flex-col gap-4 overflow-y-auto p-4 max-md:order-0 md:p-8"
		>
			<header class="flex flex-col gap-4">
				<h1 class="text-2xl font-bold px-8">Écrire une publication</h1>
				<div class="px-8">
					<Input
						v-model="isPrev"
						label="Prévisualiser la publication"
						type="checkbox"
					/>
				</div>
			</header>
			<main class="flex flex-col gap-4 overflow-visible">
				<PostBox :data="preparingPost" :editable="!isPrev" />
			</main>
		</section>
		<aside
			class="basis-1/3 sticky top-24 flex flex-col gap-4 overflow-y-auto p-4 max-md:order-0 md:p-8 max-xl:hidden"
		>
			<!-- Profils -->
		</aside>
	</div>
</template>
