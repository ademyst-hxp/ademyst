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

const { $api } = useNuxtApp();
const { session, refresh } = useAuthSession();
await refresh();

const error = ref<string | null>(null);

const route = useRoute();
const { parent: parentPostId, edit: editPostId } = route.query as {
	parent?: string;
	quote?: string;
	edit?: string;
};

if (!session.value) {
	navigateTo("/auth/login");
}

definePageMeta({
	title: "Écrire un post | Ademyst",
	description:
		"Exprimez-vous et partagez vos idées avec la communauté Ademyst en écrivant un post.",
	middleware: ["auth"],
});

useHead({
	title: "Écrire un post | Ademyst",
	meta: [
		{
			name: "description",
			content:
				"Exprimez-vous et partagez vos idées avec la communauté Ademyst en écrivant un post.",
		},
		{
			name: "keywords",
			content: "Beam, Ademyst, Discover",
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
	parentId: parentPostId || null,
	visibility: "everyone",
	content: "",
	createdAt: new Date(),
	updatedAt: null,
	attachments: [],
	flags: {
		NFE: false,
		AI: false,
		joke: false,
		misinformation: false,
		spam: false,
		suspicious: false,
		suicide: false,
		reported: false,
	},
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

if (editPostId) {
	// Fetch the post to edit
	$api(`/posts/${editPostId}`)
		.then((response: any) => {
			if (!response.data) {
				error.value = "Publication introuvable.";
				return;
			}

			if (response.data.profile?.id !== session.value?.profile?.id) {
				navigateTo("/discover");
				return;
			}

			preparingPost.value = response.data;
		})
		.catch((e: any) => {
			error.value =
				e.message ||
				"Erreur lors de la récupération de la publication.";
		});
}

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
		if (editPostId) {
			// Update the existing post
			try {
				await $api(`/posts/${editPostId}/edit`, {
					method: "PUT",
					body: preparingPost.value,
				});
			} catch (e: any) {
				error.value =
					e.message ||
					"Erreur lors de la mise à jour de la publication.";
			}
		} else {
			// Create a new post
			try {
				await $api("/posts/new", {
					method: "POST",
					body: preparingPost.value,
				});
			} catch (e: any) {
				error.value =
					e.message ||
					"Erreur lors de la création de la publication.";
			}
		}

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
