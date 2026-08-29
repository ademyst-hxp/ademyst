<script setup lang="ts">
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

const error = ref<string | null>(null);

const { $api } = useNuxtApp();
const { session, refresh } = useAuthSession();

const route = useRoute();
const postId = route.params.id as string;

// Fired concurrently rather than awaited one-by-one: each hits its own
// SSR API route (own auth check, own DB round trip), so sequencing them
// serialized three independent network round trips into one long chain.
const refreshPromise = refresh();

const postAsyncData = useAsyncData<Post | null>(
	`post-${postId}`,
	async () => {
		try {
			const response = await $api<{ status: string; data: Post }>(
				`/posts/${postId}`,
			);
			return response.data;
		} catch (e: any) {
			error.value = e.message || "Erreur lors du chargement du post.";
			return null;
		}
	},
	{ default: () => null },
);

const answersAsyncData = useAsyncData<Post[]>(
	`post-${postId}-answers`,
	async () => {
		try {
			const response = await $api<{ status: string; data: Post[] }>(
				`/posts/${postId}/answers`,
			);
			return response.data;
		} catch (e: any) {
			error.value =
				e.message || "Erreur lors du chargement des réponses.";
			return [];
		}
	},
	{ default: () => [] },
);

await Promise.all([refreshPromise, postAsyncData, answersAsyncData]);

const { data: post, pending: postPending } = postAsyncData;
const { data: answers } = answersAsyncData;

if (!session.value) {
	navigateTo("/auth/login");
}

definePageMeta({
	middleware: ["auth"],
});

useHead({
	title: `Publication de ${post.value?.profile?.displayName || "@" + post.value?.profile?.name || "@ghost"} | Ademyst`,
	meta: [
		{
			name: "description",
			content:
				post.value?.content.slice(0, 160) ||
				`Découvrez la publication de ${post.value?.profile?.displayName || "@" + post.value?.profile?.name || "@ghost"} sur Ademyst.`,
		},
		{
			name: "keywords",
			content: "Beam, Ademyst, Discover",
		},
		{
			name: "author",
			content:
				post.value?.profile?.displayName ||
				"@" + post.value?.profile?.name ||
				"@ghost",
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
	parentId: postId || null,
	visibility: "everyone",
	content: "",
	createdAt: new Date(),
	updatedAt: null,
	attachments: [],
	flags: [],
	interaction: {
		liked: false,
		reported: false,
		saved: false,
	},
	stats: {
		reactions: {
			like: 0,
		},
		answers: 0,
		score: 0,
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
	} catch (e: any) {
		error.value = e.message || "Erreur lors de la publication du post.";
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
			<PostBox v-if="post" :data="post" />
			<article
				v-else-if="!postPending"
				class="flex flex-col gap-2"
			>
				<h1 class="text-2xl font-bold">Publication introuvable</h1>
				<p>La publication que vous recherchez n'existe pas.</p>
			</article>
			<header>
				<div class="flex flex-col gap-4">
					<h1 class="text-2xl font-bold px-8">
						Écrire une publication
					</h1>
					<div class="flex flex-col gap-2 px-8">
						<Input
							v-model="isPrev"
							label="Prévisualiser la publication"
							type="checkbox"
						/>
						<p>
							Visibilité:
							<b>{{
								visibilityLabels[preparingPost.visibility]
							}}</b>
							(<u
								class="cursor-pointer text-primary underline"
								@click="isVisibilityMenuOpen = true"
								>Changer</u
							>)
						</p>
					</div>
				</div>
				<div class="flex flex-col gap-4 overflow-visible">
					<PostBox :data="preparingPost" :editable="!isPrev" />
					<section class="flex flex-col gap-2 px-8">
						<Button
							label="Publier"
							variant="primary"
							:disabled="!isGood"
							:handler="handlePublish"
						/>
					</section>
				</div>
			</header>
			<main class="flex flex-col gap-4">
				<PostBox
					v-for="answer in answers"
					:key="answer.id"
					:data="answer"
				/>
			</main>
		</section>
		<aside
			class="basis-1/4 sticky top-24 flex flex-col gap-4 overflow-y-auto p-4 max-md:order-0 md:p-8 max-xl:hidden"
		></aside>
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
