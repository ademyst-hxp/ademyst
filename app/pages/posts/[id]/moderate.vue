<script setup lang="ts">
import { BuildingOffice2Icon, MapPinIcon } from "@heroicons/vue/24/solid";
import { FlagIcon } from "@heroicons/vue/24/outline";

import type { Profile } from "~~/shared/models/profiles";
import type { Sanction } from "~~/shared/models/sanctions";
import type { Post } from "~~/shared/models/interactions";
import type { ProfileReport } from "~~/shared/models/reports";
import type { PostReport } from "~~/shared/models/reports";

import PostBox from "~/components/interactions/Post.vue";
import PostReportBox from "~/components/moderation/PostReport.vue";

import SanctionView from "~/components/moderation/Sanction.vue";
import PostReportView from "~/components/moderation/PostReport.vue";
import Box from "~/components/base/Box.vue";

const error = ref<string | null>(null);

const { $api } = useNuxtApp();
const { session, refresh } = useAuthSession();

const route = useRoute();
const postId = route.params.id as string;

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
	title: `Modérer une publication | Ademyst`,
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

const { data: reports } = await useAsyncData(
	`reports-${postId ?? "missing"}`,
	async () => {
		if (!postId) throw createError({ statusCode: 400 });

		return (
			await $api<{ reports: PostReport[] }>(
				`/moderation/posts/${encodeURIComponent(postId)}/reports`,
			)
		).reports;
	},
);

const tab = ref<"overview" | "reports" | "flags">("overview");

const tabs = computed<{ name: string; value: string }[]>(() => {
	let _tabs = [
		{ name: "Aperçu", value: "overview" },
		{ name: "Signalements", value: "reports" },
		// { name: "Flags", value: "flags" },
	];

	return _tabs;
});
</script>
<template>
	<div class="mx-auto max-w-7xl lg:flex">
		<header
			class="p-6 px-8 space-y-6 md:p-8 lg:w-1/2 xl:w-1/3 lg:sticky lg:top-24 lg:self-start"
		>
			<PostBox v-if="post" :data="post" />
		</header>
		<main
			class="flex flex-col gap-4 max-lg:p-4 lg:w-1/2 xl:w-2/3 md:p-8 min-w-0"
		>
			<div class="lg:flex lg:justify-end">
				<TabBar v-model="tab" :tabs="tabs" />
			</div>

			<section v-if="tab === 'overview'" class="space-y-2">
				<h2 class="px-8 text-2xl font-bold">Aperçu</h2>
				<div
					class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:max-lg:grid-cols-3 xl:grid-cols-3"
				>
					<Box
						class="flex-0 -space-y-1 sm:max-md:col-span-2 lg:max-xl:col-span-2"
						scale="sm"
					>
						<span class="text-2xl font-bold">{{
							post?.stats.score
						}}</span>
						<span
							v-if="(post?.stats.score ?? 0) > 100"
							class="text-primary font-semibold"
						>
							Hit Beam !
						</span>
						<span v-else class="text-muted">Score</span>
					</Box>
					<Box
						class="flex-0 -space-y-1"
						:class="
							(reports?.filter((r) => r.status == 'pending')
								.length ?? 0 > 0)
								? 'shadow-xl shadow-warning/20'
								: ''
						"
						scale="sm"
					>
						<p class="text-2xl font-bold">
							<template
								v-if="
									reports?.filter(
										(r) => r.status == 'pending',
									).length ?? 0 > 0
								"
							>
								<span class="font-extrabold text-warning">{{
									reports?.filter(
										(r) => r.status == "pending",
									).length ?? 0
								}}</span>
								/
							</template>
							{{ reports?.length ?? 0 }}
						</p>
						<span class="text-muted">Signalements</span>
					</Box>
					<Box class="flex-0 -space-y-1" scale="sm">
						<span class="text-2xl font-bold">{{
							post?.flags?.length ?? 0
						}}</span>
						<span class="text-muted">Flags</span>
					</Box>
				</div>
			</section>

			<section v-if="tab === 'reports'" class="space-y-2">
				<div class="flex flex-col -space-y-1 px-8">
					<h2 class="text-2xl font-bold">Signalements</h2>
					<div
						v-if="!reports || reports.length === 0"
						class="text-muted"
					>
						Aucun signalement pour cette publication.
					</div>
				</div>
				<div class="flex flex-col gap-4">
					<PostReportView
						v-for="report in reports ?? []"
						:key="report.id"
						:data="report"
						:editable="false"
						:handlable="true"
					/>
				</div>
			</section>
		</main>
	</div>
</template>
