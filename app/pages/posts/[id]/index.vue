<script setup lang="ts">
import type { Post } from "~~/shared/models/interactions";
import { VISIBILITY_OPTIONS } from "~~/shared/consts/labels";

import {
	ArrowPathIcon,
	EyeSlashIcon,
	GlobeAltIcon,
	HeartIcon,
	RocketLaunchIcon,
	UserGroupIcon,
} from "@heroicons/vue/24/outline";

import PostBox from "~/components/interactions/Post.vue";
import Menu from "~/components/Menu.vue";

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

const ANSWERS_PAGE_SIZE = 20;

type AnswersPage = { answers: Post[]; next: number; hasNext: boolean };

const fetchAnswersPage = async (offset: number): Promise<AnswersPage> => {
	const response = await $api<{
		status: string;
		data: Post[];
		next: number;
		hasNext: boolean;
	}>(`/posts/${postId}/answers`, {
		query: { limit: ANSWERS_PAGE_SIZE, offset },
	});

	return {
		answers: response.data,
		next: response.next,
		hasNext: response.hasNext,
	};
};

const answersAsyncData = useAsyncData<AnswersPage>(
	`post-${postId}-answers`,
	async () => {
		try {
			return await fetchAnswersPage(0);
		} catch (e: any) {
			error.value =
				e.message || "Erreur lors du chargement des réponses.";
			return { answers: [], next: 0, hasNext: false };
		}
	},
	{ default: () => ({ answers: [], next: 0, hasNext: false }) },
);

await Promise.all([refreshPromise, postAsyncData, answersAsyncData]);

const { data: post, pending: postPending } = postAsyncData;
const { data: firstAnswersPage } = answersAsyncData;

// Answers loaded so far (first page + the following ones).
const answers = ref<Post[]>(firstAnswersPage.value.answers);
const answersNext = ref(firstAnswersPage.value.next);
const answersHasNext = ref(firstAnswersPage.value.hasNext);
const loadingMoreAnswers = ref(false);

const loadMoreAnswers = async (): Promise<boolean> => {
	if (loadingMoreAnswers.value || !answersHasNext.value) return false;

	loadingMoreAnswers.value = true;

	try {
		const page = await fetchAnswersPage(answersNext.value);

		// Never show the same answer twice if the offsets shifted meanwhile.
		const known = new Set(answers.value.map((answer) => answer.id));

		answers.value = [
			...answers.value,
			...page.answers.filter((answer) => !known.has(answer.id)),
		];
		answersNext.value = page.next;
		answersHasNext.value = page.hasNext;

		return true;
	} catch (e: any) {
		error.value = e.message || "Erreur lors du chargement des réponses.";

		return false;
	} finally {
		loadingMoreAnswers.value = false;
	}
};

const { sentinel } = useScrollSentinel(
	loadMoreAnswers,
	() => answersHasNext.value,
);

if (!session.value) {
	navigateTo("/auth/login");
}

definePageMeta({
	title: "Publication | Ademyst",
	description: "Découvrez la publication d'un utilisateur sur Ademyst.",
	layout: "default",
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

const limit = computed(
	() => getPostSpecs(session.value!.profile.level).max_length,
);

const isInLimit = computed(() => {
	return preparingPost.value.content.length <= limit.value;
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
	<Teleport to="#header">
		<PostBox v-if="post" :data="post" />
		<template v-else-if="!postPending">
			<h1 class="text-2xl font-bold font-title">
				Publication introuvable
			</h1>
			<p>La publication que vous recherchez n'existe pas.</p>
		</template>
	</Teleport>

	<section id="compose" class="flex flex-col gap-4 overflow-visible">
		<h2 class="text-xl font-bold font-title text-center">
			Répondre à la publication
		</h2>
		<PostBox v-if="isPrev" :data="preparingPost" disabled />
		<template v-else>
			<Input
				v-model="preparingPost.content"
				label="Répondre à la publication"
				placeholder="Répondre à la publication..."
				type="textarea"
				class="h-48"
			/>
			<p
				class="text-sm"
				:class="{
					'text-muted': isInLimit,
					'text-danger': !isInLimit,
				}"
			>
				{{ preparingPost.content.length }} / {{ limit }} caractères
			</p>
		</template>
		<div class="flex flex-col gap-2 px-8">
			<Input v-model="isPrev" label="Prévisualiser" type="checkbox" />
		</div>
		<div class="flex justify-center items-center gap-2">
			<Button
				label="Publier"
				variant="primary"
				:disabled="!isGood"
				:handler="handlePublish"
			/>
			<InlineSelect
				v-model="preparingPost.visibility"
				:options="
					VISIBILITY_OPTIONS.map(({ value, icon, description }) => ({
						value,
						icon,
						description,
					}))
				"
				scale="small"
			/>
		</div>
	</section>
	<section class="flex flex-col gap-4">
		<PostBox v-for="answer in answers" :key="answer.id" :data="answer" />
	</section>

	<!-- Pagination sentinel -->
	<div ref="sentinel" class="flex justify-center py-6 text-muted">
		<ArrowPathIcon v-if="loadingMoreAnswers" class="w-6 h-6 animate-spin" />
	</div>
</template>
