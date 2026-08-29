<script setup lang="ts">
import PostBox from "~/components/interactions/Post.vue";
import PostReportBox from "~/components/moderation/PostReport.vue";

import { FlagIcon } from "@heroicons/vue/24/outline";

import type { Post } from "~~/shared/models/interactions";
import type { PostReport } from "~~/shared/models/reports";

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

await Promise.all([refreshPromise, postAsyncData]);

const { data: post, pending: postPending } = postAsyncData;

if (!session.value) {
	navigateTo("/auth/login");
}

definePageMeta({
	middleware: ["auth"],
});

useHead({
	title: `Signaler une publication | Ademyst`,
	meta: [
		{
			name: "description",
			content: `Signaler la publication de ${post.value?.profile?.displayName || "@" + post.value?.profile?.name || "@ghost"} sur Ademyst.`,
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

/*********************/

const newReport = ref<PostReport>({
	id: "",
	reason: "",
	details: "",
	status: "pending",
	reporter: {
		id: "",
		email: "",
		createdAt: new Date(),
		confirmedAt: new Date(),
		updatedAt: new Date(),
	},
	reportedPost: post.value ?? {
		id: "",
		profile: {
			id: "",
			name: "",
			displayName: "",
			bio: "",
			location: "",
			corporation: "",
			birthday: null,
			pronouns: null,
			links: [],
			badge: null,
			badges: [],
			level: 0,
			stats: { following: 0, followers: 0 },
			relationships: {
				me: false,
				following: false,
				followed: false,
				friend: false,
				blocking: false,
			},
			createdAt: new Date(),
		},
		parentId: null,
		visibility: "everyone",
		content: "",
		createdAt: new Date(),
		updatedAt: null,
		stats: {
			reactions: {
				like: 0,
			},
			answers: 0,
			score: 0,
		},
		attachments: [],
		flags: [],
		interaction: {
			liked: false,
			reported: false,
			saved: false,
		},
	},
	createdAt: new Date(),
});

const submitReport = async () => {
	if (!post.value) return;

	const response = await $api<PostReport>(
		`/posts/${encodeURIComponent(post.value.id)}/report`,
		{
			method: "POST",
			body: newReport.value,
		},
	);

	if (response) {
		newReport.value = response;
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
			<article v-else-if="!postPending" class="flex flex-col gap-2">
				<h1 class="text-2xl font-bold">Publication introuvable</h1>
				<p>La publication que vous recherchez n'existe pas.</p>
			</article>
			<header>
				<div class="flex flex-col gap-4 overflow-visible">
					<PostReportBox
						:key="newReport.id"
						:data="newReport"
						:editable="true"
					>
						<template #edit-actions>
							<Button
								label="Signaler"
								:icon="FlagIcon"
								variant="danger"
								:handler="submitReport"
							/>
						</template>
					</PostReportBox>
				</div>
			</header>
		</section>
		<aside
			class="basis-1/4 sticky top-24 flex flex-col gap-4 overflow-y-auto p-4 max-md:order-0 md:p-8 max-xl:hidden"
		></aside>
	</div>
</template>
