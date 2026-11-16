<script setup lang="ts">
import ArrowPathIcon from "@heroicons/vue/24/outline/ArrowPathIcon";
import ChevronLeftIcon from "@heroicons/vue/24/outline/ChevronLeftIcon";

import type { Hashtag, Post } from "~~/shared/models/interactions";

import Button from "~/components/Button.vue";
import Box from "~/components/base/Box.vue";
import PostBox from "~/components/interactions/Post.vue";
import Warning from "~/components/boxes/Warning.vue";

const route = useRoute();
const { $api } = useNuxtApp();
const { refresh: refreshSession } = useAuthSession();

await refreshSession();

const tag = computed(() => String(route.params.tag ?? ""));
const posts = ref<Post[]>([]);
const hashtag = ref<Hashtag | null>(null);
const next = ref(0);
const hasNext = ref(true);
const total = ref(0);
const loading = ref(false);
const loadingMore = ref(false);
const error = ref<string | null>(null);
const generation = ref(0);

type TagFeedResponse = {
	status: string;
	hashtag: Hashtag;
	posts: Post[];
	total: number;
	next: number;
	hasNext: boolean;
};

const endpoint = () => `/api/v1/feed/tags/${encodeURIComponent(tag.value)}`;

const loadFirstPage = async () => {
	const response = await $api<TagFeedResponse>(endpoint(), {
		query: { limit: 20, offset: 0 },
	});

	posts.value = response.posts;
	hashtag.value = response.hashtag;
	total.value = response.total;
	next.value = response.next;
	hasNext.value = response.hasNext;
};

const refreshFeed = async () => {
	loading.value = true;
	error.value = null;
	generation.value++;

	try {
		await loadFirstPage();
	} catch (err) {
		error.value = err instanceof Error ? err.message : String(err);
	} finally {
		loading.value = false;
	}
};

const loadMore = async () => {
	if (loading.value || loadingMore.value || !hasNext.value) return false;

	loadingMore.value = true;
	error.value = null;
	const startedGeneration = generation.value;

	try {
		const response = await $api<TagFeedResponse>(endpoint(), {
			query: { limit: 20, offset: next.value },
		});

		if (startedGeneration !== generation.value) return false;

		const known = new Set(posts.value.map((post) => post.id));
		posts.value = [
			...posts.value,
			...response.posts.filter((post) => !known.has(post.id)),
		];
		hashtag.value = response.hashtag;
		total.value = response.total;
		next.value = response.next;
		hasNext.value = response.hasNext;
		return true;
	} catch (err) {
		error.value = err instanceof Error ? err.message : String(err);
		return false;
	} finally {
		loadingMore.value = false;
	}
};

await useAsyncData(
	() => `tag-feed-${tag.value}`,
	async () => {
		await refreshFeed();
		return true;
	},
);

watch(tag, () => {
	void refreshFeed();
});

const { sentinel, recheck } = useScrollSentinel(loadMore, () => hasNext.value);

watch(loading, (isLoading) => {
	if (!isLoading) recheck();
});

definePageMeta({
	title: "Publications avec un tag | Ademyst",
	description: "Découvrez les publications associées à ce tag.",
	middleware: ["auth"],
});

useHead(() => ({
	title: hashtag.value ? `#${hashtag.value.tag} | Ademyst` : "Tag | Ademyst",
}));
</script>
<template>
	<Teleport to="#header">
		<h1 class="text-3xl font-bold text-center font-title">Recherche</h1>
	</Teleport>

	<Teleport to="#side-right">
		<Box>
			<div class="flex flex-col">
				<h1 class="text-2xl font-bold font-title">
					#{{ hashtag?.tag || tag }}
				</h1>
				<p class="text-sm text-surface-text-muted">
					{{ total }} publication{{ total !== 1 ? "s" : "" }}
				</p>
			</div>
			<p>
				Ce hashtag est libre et indépendant de toute ligne éditoriale.
				Il n'est pas impossible de trouver des publications hors sujet.
			</p>
			<Warning
				v-if="hashtag?.flags?.NFE"
				title="Nudité ou des contenus sensibles"
				class="-m-4 mt-0"
			>
				Certaines des publications associées à ce hashtag peuvent
				contenir de la nudité ou des contenus sensibles. Soyez prudent
				lors de la navigation.
			</Warning>
		</Box>
	</Teleport>

	<section class="flex flex-col gap-2">
		<div
			v-if="error"
			class="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-danger"
		>
			{{ error }}
		</div>

		<div
			v-else-if="!loading && posts.length === 0"
			class="flex flex-col items-center gap-2 rounded-2xl border border-surface-border p-8 text-center"
		>
			<p class="font-semibold">Aucune publication trouvée</p>
			<p class="text-sm text-surface-text-muted">
				Aucune publication ne contient encore ce tag.
			</p>
		</div>

		<PostBox v-for="post in posts" :key="post.id" :data="post" />
	</section>

	<div ref="sentinel" class="flex justify-center py-6 text-muted">
		<ArrowPathIcon
			v-if="loading || loadingMore"
			class="h-6 w-6 animate-spin"
		/>
		<p v-else-if="!hasNext" class="text-sm">
			Vous avez atteint la fin des publications.
		</p>
	</div>
</template>
