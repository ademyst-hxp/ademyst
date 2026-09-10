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
	title: "Modérer une publication | Ademyst",
	description: "Modérez une publication sur Ademyst.",
	layout: "default",
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

const tab = ref<"reports" | "flags">("reports");

const tabs = computed<{ name: string; value: string }[]>(() => {
	let _tabs = [
		{ name: "Signalements", value: "reports" },
		{ name: "Flags", value: "flags" },
	];

	return _tabs;
});

/*****************/
const flagsPayload = ref({
	spam: post.value?.flags.spam || false,
	NFE: post.value?.flags.NFE || false,
	AI: post.value?.flags.AI || false,
	misinformation: post.value?.flags.misinformation || false,
	joke: post.value?.flags.joke || false,
	suspicious: post.value?.flags.suspicious || false,
});

const submitFlags = async () => {
	if (!postId) return;

	try {
		const response = await $fetch(
			`/api/v1/moderation/posts/${encodeURIComponent(postId)}/flags`,
			{
				method: "PUT",
				body: flagsPayload.value,
			},
		);

		if (response) {
			await refresh();
			alert("Flags mis à jour avec succès !");
		}
	} catch (error: any) {
		alert(
			error?.message ||
				"Une erreur est survenue lors de la mise à jour des flags.",
		);
	}
};
</script>
<template>
	<Teleport to="#header">
		<div
			v-if="post?.flags.reported"
			class="flex items-center gap-2 bg-danger/15 text-danger border border-danger/40 rounded-xl p-4"
		>
			<p class="text-sm font-semibold">
				Cette publication aété signalée de nombreuses fois.
			</p>
		</div>
		<div
			class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:max-lg:grid-cols-3 xl:grid-cols-3"
		>
			<Box
				class="flex-0 -space-y-1 sm:max-md:col-span-2 lg:max-xl:col-span-2"
				scale="sm"
			>
				<span class="text-2xl font-bold">{{ post?.stats.score }}</span>
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
					(reports?.filter((r) => r.status == 'pending').length ??
					0 > 0)
						? 'shadow-xl shadow-warning/20'
						: ''
				"
				scale="sm"
			>
				<p class="text-2xl font-bold">
					<template
						v-if="
							reports?.filter((r) => r.status == 'pending')
								.length ?? 0 > 0
						"
					>
						<span class="font-extrabold text-warning">{{
							reports?.filter((r) => r.status == "pending")
								.length ?? 0
						}}</span>
						/
					</template>
					{{ reports?.length ?? 0 }}
				</p>
				<span class="text-muted">Signalements</span>
			</Box>
			<Box class="flex-0 -space-y-1" scale="sm">
				<span class="text-2xl font-bold">{{
					Object.values(post?.flags || {}).some((v) => v === true)
						? "Oui"
						: "Aucun"
				}}</span>
				<span class="text-muted">Flags</span>
			</Box>
		</div>
	</Teleport>

	<PostBox v-if="post" :data="post" />

	<TabBar v-model="tab" :tabs="tabs" />

	<section v-if="tab === 'reports'" class="flex flex-col gap-2">
		<PostReportView
			v-for="report in reports ?? []"
			:key="report.id"
			:data="report"
			:editable="false"
			:handlable="true"
		/>
	</section>

	<section v-if="tab === 'flags'" class="flex flex-col gap-2 px-8">
		<Input
			v-model="flagsPayload.NFE"
			label="Nudité, violence, contenu explicite ou choquant"
			type="checkbox"
		/>
		<Input
			v-model="flagsPayload.AI"
			label="Contenu généré partiellement ou totalement par une intelligence artificielle"
			type="checkbox"
		/>
		<Input v-model="flagsPayload.spam" label="Spam" type="checkbox" />
		<Input
			v-model="flagsPayload.misinformation"
			label="Désinformation"
			type="checkbox"
		/>
		<Input
			v-model="flagsPayload.joke"
			label="Blague ou contenu humoristique"
			type="checkbox"
		/>
		<Input
			v-model="flagsPayload.suspicious"
			label="Contenu suspect ou douteux"
			type="checkbox"
		/>
		<Button
			label="Mettre à jour les flags"
			variant="primary"
			:handler="submitFlags"
		/>
	</section>
</template>
