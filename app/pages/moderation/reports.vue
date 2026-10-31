<script setup lang="ts">
import type { ReportsTab } from "~/composables/useModeration";

import PostReportBox from "~/components/moderation/PostReport.vue";
import ProfileReportBox from "~/components/moderation/ProfileReport.vue";

import { ArrowPathIcon } from "@heroicons/vue/24/outline";

const { $api } = useNuxtApp();

const { session, refresh: refreshSession } = useAuthSession();
const {
	whispers: whispersReports,
	posts: postsReports,
	users: usersReports,
	loading,
	loadingMore,
	refresh,
	loadTab,
	loadMore,
	hasMore,
} = useReports();

const tab = ref<ReportsTab>("users");

const refreshReports = () => refresh(tab.value);

await refreshSession();

const profile = session.value?.profile;

if (!profile) {
	await navigateTo("/auth/login");
}

// Fetched once on the server and reused from the payload when hydrating,
// instead of running again in the browser.
await useAsyncData("moderation-reports", async () => {
	await refreshReports();

	return true;
});

watch(tab, (value) => loadTab(value));

// Infinite scroll: when the sentinel at the bottom of the feed gets close to
// the viewport, the next page of the current tab is requested.
const { sentinel, recheck } = useScrollSentinel(
	() => loadMore(tab.value),
	() => hasMore(tab.value),
);

// A page requested while the feed was loading is skipped: once the loading
// is over, check again whether the sentinel is still on screen.
watch(loading, (value) => {
	if (!value) recheck();
});

definePageMeta({
	title: "Ademyst: Modération",
	description: "Panel de modération pour les modérateurs d'Ademyst.",
	middleware: ["auth", "moderation"],
});

useHead({
	title: "Ademyst: Modération",
	meta: [
		{
			name: "viewport",
			content: "width=device-width, initial-scale=1.0",
		},
		{
			name: "robots",
			content: "noindex, nofollow",
		},
	],
});
</script>
<template>
	<Teleport to="#header">
		<h1 class="text-3xl font-bold text-center font-title">
			Espace Modération
		</h1>
		<TabBar
			v-model="tab"
			:tabs="[
				{ name: 'Profils', value: 'users' },
				{ name: 'Publications', value: 'posts' },
			]"
		/>
	</Teleport>

	<section
		class="flex flex-col gap-2 overflow-visible"
		v-if="tab === 'users'"
	>
		<ProfileReportBox
			v-for="report in usersReports"
			:key="report.id"
			:data="report"
			handlable
		/>
	</section>

	<section
		class="flex flex-col gap-2 overflow-visible"
		v-if="tab === 'posts'"
	>
		<PostReportBox
			v-for="report in postsReports"
			:key="report.id"
			:data="report"
			handlable
		/>
	</section>

	<!-- Pagination sentinel -->
	<div ref="sentinel" class="flex justify-center py-6 text-muted">
		<ArrowPathIcon
			v-if="loadingMore || loading"
			class="w-6 h-6 animate-spin"
		/>
		<p v-else-if="!hasMore(tab)" class="text-sm">
			Vous avez tout vu pour le moment.
		</p>
	</div>
</template>
