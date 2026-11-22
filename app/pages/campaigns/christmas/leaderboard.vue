<script setup lang="ts">
import type {
	LeaderboardEntry,
	LeaderboardResponse,
	QuestsResponse,
} from "~~/shared/models/campaigns/christmas";

import TabBar from "~/components/TabBar.vue";
import Box from "~/components/base/Box.vue";
import CampaignBanner from "~/components/campaigns/christmas/banners/CampaignBanner.vue";
import LeaderboardList from "~/components/campaigns/christmas/leaderboard/LeaderboardList.vue";
import MyStats from "~/components/campaigns/christmas/leaderboard/MyStats.vue";
import Button from "~/components/Button.vue";

const PAGE_SIZE = 50;
const { $api } = useNuxtApp();
const { session, refresh: refreshSession } = useAuthSession();

await refreshSession();

const tab = ref("leaderboard");

watch(tab, (value) => {
	if (value === "presentation") navigateTo("/campaigns/christmas");
	if (value === "quests") navigateTo("/campaigns/christmas/quests");
});

definePageMeta({
	title: "Ademyst: Classement de Noël",
	description: "Classement des Quêtes de Noël 2026.",
});

useHead({
	title: "Ademyst: Classement de Noël",
	meta: [
		{
			name: "description",
			content: "Découvrez le classement des Quêtes de Noël.",
		},
	],
});

const entries = ref<LeaderboardEntry[]>([]);
const me = ref<LeaderboardResponse["me"]>(null);
const total = ref(0);
const next = ref(0);
const hasNext = ref(false);
const loadingMore = ref(false);
const questsReport = ref<QuestsResponse | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchInitial = async () => {
	loading.value = true;
	error.value = null;

	try {
		const [leaderboard, quests] = await Promise.all([
			$api<LeaderboardResponse>("/campaigns/christmas/leaderboard", {
				query: { limit: PAGE_SIZE, offset: 0 },
			}),
			session.value
				? $api<QuestsResponse>("/campaigns/christmas/quests").catch(
						() => null,
					)
				: Promise.resolve(null),
		]);

		entries.value = leaderboard.data;
		me.value = leaderboard.me;
		total.value = leaderboard.total;
		next.value = leaderboard.next;
		hasNext.value = leaderboard.hasNext;
		questsReport.value = quests;
	} catch (caught) {
		error.value =
			caught instanceof Error
				? caught.message
				: "Impossible de charger le classement.";
	} finally {
		loading.value = false;
	}
};

await useAsyncData("christmas-leaderboard", fetchInitial);

const loadMore = async (): Promise<boolean> => {
	if (loadingMore.value || !hasNext.value) return false;

	loadingMore.value = true;

	try {
		const page = await $api<LeaderboardResponse>(
			"/campaigns/christmas/leaderboard",
			{ query: { limit: PAGE_SIZE, offset: next.value } },
		);
		const known = new Set(entries.value.map((entry) => entry.profile.id));

		entries.value = [
			...entries.value,
			...page.data.filter((entry) => !known.has(entry.profile.id)),
		];
		next.value = page.next;
		hasNext.value = page.hasNext;

		return page.data.length > 0;
	} catch (caught) {
		console.error("Erreur lors du chargement du classement:", caught);
		return false;
	} finally {
		loadingMore.value = false;
	}
};

const { sentinel, recheck } = useScrollSentinel(
	loadMore,
	() => hasNext.value,
);

watch(loadingMore, (value) => {
	if (!value) recheck();
});
</script>
<template>
	<Teleport to="#header">
		<div class="flex flex-col gap-3">
			<h1 class="text-3xl font-bold text-center font-title">
				Classement
			</h1>
			<TabBar
				v-model="tab"
				:tabs="[
					{ name: 'Présentation', value: 'presentation' },
					{ name: 'Quêtes', value: 'quests' },
					{ name: 'Classement', value: 'leaderboard' },
				]"
			/>
		</div>
	</Teleport>

	<CampaignBanner
		v-if="questsReport"
		:year="questsReport.campaign.year"
		:today="questsReport.campaign.today"
		:started="questsReport.campaign.started"
		:ended="questsReport.campaign.ended"
	/>

	<MyStats
		:me="me"
		:participants="total"
		:summary="questsReport?.summary ?? null"
		:authenticated="Boolean(session)"
		:milestones="[
			{ badgeId: 'premier_noel', name: 'Premier Noël', minPoints: 50 },
			{ badgeId: 'cyber_santa', name: 'Cyber Santa', minPoints: 75 },
			{ badgeId: 'prestige', name: 'Prestige', minPoints: 100 },
		]"
	>
		<template #login>
			<Button
				label="Se connecter"
				size="small"
				handler="/auth/login"
			/>
		</template>
	</MyStats>

	<section class="flex flex-col gap-2">
		<h2 class="text-2xl font-bold font-title text-center">
			Classement général
		</h2>

		<p v-if="loading" class="p-6 text-center text-muted" role="status">
			Chargement du classement…
		</p>

		<Box
			v-else-if="error"
			class="items-center text-center"
			role="alert"
		>
			<p>{{ error }}</p>
			<Button
				label="Réessayer"
				size="small"
				:handler="fetchInitial"
			/>
		</Box>

		<LeaderboardList
			v-else
			:entries="entries"
			:current-profile-id="session?.profile.id ?? null"
			:loading-more="loadingMore"
		>
			<template #footer>
				<div ref="sentinel" class="h-px" aria-hidden="true" />
			</template>
		</LeaderboardList>
	</section>
</template>
