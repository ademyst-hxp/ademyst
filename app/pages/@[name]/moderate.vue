<script setup lang="ts">
import type { Post } from "~~/shared/models/interactions";
import type { Profile } from "~~/shared/models/profiles";
import type { ProfileReport } from "~~/shared/models/reports";
import type { Sanction } from "~~/shared/models/sanctions";
import type { Badge } from "~~/shared/models/shop";
import { LEVELS } from "~~/shared/consts/labels";

import { BuildingOffice2Icon, MapPinIcon } from "@heroicons/vue/24/solid";

import Box from "~/components/base/Box.vue";
import FilterSelect from "~/components/base/FilterSelect.vue";
import ProfileReportView from "~/components/moderation/ProfileReport.vue";
import SanctionView from "~/components/moderation/Sanction.vue";
import BadgeInfo from "~/components/profile/BadgeInfo.vue";

type ProfileResponse = {
	status: "ok";
	profile: Profile;
};

const route = useRoute();
const { $api } = useNuxtApp();

definePageMeta({
	layout: "profile",
	middleware: ["auth", "moderation"],
});

const name = computed(() => {
	const raw = route.params.name;
	return Array.isArray(raw) ? raw[0] : raw;
});

const requestKey = computed(() => `profile-${name.value ?? "missing"}`);
// Not `posts-<name>`: the profile page caches another shape under that key.
const postsRequestKey = computed(
	() => `posts-count-${name.value ?? "missing"}`,
);

const { data, pending } = await useAsyncData(requestKey, async () => {
	if (!name.value) throw createError({ statusCode: 400 });

	return $api<ProfileResponse>(`/users/${encodeURIComponent(name.value)}`);
});

// Only used for the "Publications" counter: one page of 100 is enough, a "+"
// is displayed when there are more.
const { data: postsPage } = await useAsyncData(postsRequestKey, async () => {
	if (!name.value) throw createError({ statusCode: 400 });

	const response = await $api<{ posts: Post[]; hasNext: boolean }>(
		`/users/${encodeURIComponent(name.value)}/posts`,
		{ query: { limit: 100 } },
	);

	return { count: response.posts.length, hasNext: response.hasNext };
});

const { data: sanctions } =
	(await useAsyncData<Sanction[]>(
		`sanctions-${name.value ?? "missing"}`,
		async () => {
			if (!name.value) throw createError({ statusCode: 400 });

			return (
				(
					await $api<{ data: Sanction[] }>(
						`/moderation/users/${encodeURIComponent(data.value?.profile?.id || "")}/sanctions`,
					)
				).data! || []
			);
		},
	)) || [];

const { data: reports } = await useAsyncData(
	`reports-${name.value ?? "missing"}`,
	async () => {
		if (!name.value) throw createError({ statusCode: 400 });

		return (
			await $api<{ reports: ProfileReport[] }>(
				`/moderation/users/${encodeURIComponent(data.value?.profile?.id || "")}/reports`,
			)
		).reports;
	},
);

/**********/
// Server-side filters. The unfiltered lists above feed the counters of the
// overview, the filtered ones are only fetched when a filter is selected.
const REPORT_STATUS_OPTIONS = [
	{ label: "Tous", value: "" },
	{ label: "En attente", value: "pending" },
	{ label: "Traités", value: "reviewed" },
	{ label: "Rejetés", value: "rejected" },
];

const SANCTION_STATE_OPTIONS = [
	{ label: "Toutes", value: "" },
	{ label: "Actives", value: "true" },
	{ label: "Expirées", value: "false" },
];

const reportStatus = ref("");
const sanctionState = ref("");

const { data: filteredReports, pending: filteredReportsPending } =
	await useAsyncData(
		`reports-${name.value ?? "missing"}-filtered`,
		async () => {
			if (!reportStatus.value) return null;

			return (
				await $api<{ reports: ProfileReport[] }>(
					`/moderation/users/${encodeURIComponent(data.value?.profile?.id || "")}/reports`,
					{ query: { status: reportStatus.value } },
				)
			).reports;
		},
		{ watch: [reportStatus] },
	);

const { data: filteredSanctions, pending: filteredSanctionsPending } =
	await useAsyncData(
		`sanctions-${name.value ?? "missing"}-filtered`,
		async () => {
			if (!sanctionState.value) return null;

			return (
				await $api<{ data: Sanction[] }>(
					`/moderation/users/${encodeURIComponent(data.value?.profile?.id || "")}/sanctions`,
					{ query: { active: sanctionState.value } },
				)
			).data;
		},
		{ watch: [sanctionState] },
	);

const visibleReports = computed(() =>
	reportStatus.value ? (filteredReports.value ?? []) : (reports.value ?? []),
);

const visibleSanctions = computed(() =>
	sanctionState.value
		? (filteredSanctions.value ?? [])
		: (sanctions.value ?? []),
);

const profile = computed<Profile | null>(() => data.value?.profile ?? null);
const stats = computed(
	() => profile.value?.stats ?? { following: 0, followers: 0 },
);

const levelLabel = computed(() => {
	if (!profile.value) return "Inconnu";

	const level = profile.value.level;
	return level in LEVELS
		? LEVELS[level as keyof typeof LEVELS].label
		: "Inconnu";
});

const tab = ref<
	"overview" | "reports" | "warnings" | "sanctions" | "new_sanction"
>("overview");

const tabs = computed<{ name: string; value: string }[]>(() => {
	let _tabs = [
		{ name: "Aperçu", value: "overview" },
		{ name: "Signalements", value: "reports" },
		{ name: "Avertissements", value: "warnings" },
		{ name: "Sanctions", value: "sanctions" },
	];

	return _tabs;
});

/**********/
const newSanction = ref<Sanction>({
	id: "",
	type: "warning",
	reason: "",
	details: "",
	createdAt: new Date(),
	expiresAt: null,
	issuer: null,
	account: {
		id: data.value?.profile?.name ?? "",
		email: data.value?.profile?.name ?? "",
		createdAt: new Date(),
		updatedAt: new Date(),
		confirmedAt: new Date(),
	},
	profileReport: null,
	postReport: null,
	whisperReport: null,
});

const submitNewSanction = async () => {
	if (!data.value?.profile) return;

	try {
		await $api<Sanction>(
			`/moderation/users/${encodeURIComponent(data.value.profile.id)}/sanctions/create`,
			{
				method: "POST",
				body: newSanction.value,
			},
		);
	} catch (error) {
		console.error(error);
		throw error;
	}
};

useHead({
	title: `Modération de ${profile.value?.displayName ?? profile.value?.name ?? "Ghost"} | Ademyst`,
	meta: [
		{
			name: "description",
			content: `Modération du profil de ${profile.value?.displayName ?? profile.value?.name ?? "Ghost"}.`,
		},
	],
});

const focusedBadge = ref<Badge | null>(null);
</script>
<template>
	<Teleport to="#header">
		<section class="flex gap-4 items-center">
			<img
				:src="`/api/v1/users/${profile?.name}/avatar.webp`"
				class="w-24 h-24 rounded-full"
			/>

			<div class="-space-y-2">
				<div
					v-if="pending"
					class="bg-muted rounded-full h-3 w-32 animate-pulse"
				/>

				<h1 v-else class="flex items-center gap-2 text-3xl font-bold">
					{{
						profile?.displayName ??
						(profile?.name ? `@${profile.name}` : "Ghost")
					}}
					<img
						v-if="profile?.badge"
						:src="`/api/v1/badges/${profile?.badge?.id}/icon.png`"
						:alt="profile?.badge?.name"
						class="h-6 w-6"
					/>
				</h1>

				<div
					v-if="pending"
					class="bg-muted rounded-full h-3 w-24 animate-pulse"
				/>

				<span v-else class="text-muted text-lg font-semibold">
					{{ `@${profile?.name ?? "ghost"}` }}
				</span>
			</div>
		</section>

		<section
			v-if="profile?.badges && profile?.badges.length > 0"
			class="flex items-center gap-1.5 px-4"
		>
			<template :key="badge.id" v-for="badge in profile?.badges">
				<img
					:src="`/api/v1/badges/${badge.id}/icon.png`"
					:alt="badge.name"
					class="cursor-pointer h-5 w-5"
					@click="focusedBadge = badge"
				/>
			</template>
		</section>

		<section class="flex items-center gap-4 px-4">
			<div class="flex flex-col w-1/3 -space-y-1">
				<span class="text-2xl font-bold">{{
					toLitteral(postsPage?.count ?? 0) + (postsPage?.hasNext ? "+" : "")
				}}</span>
				<span class="text-muted">Publications</span>
			</div>

			<div class="flex flex-col w-1/3 -space-y-1">
				<span class="text-2xl font-bold">{{
					toLitteral(stats.following)
				}}</span>
				<span class="text-muted">Suivis</span>
			</div>

			<div class="flex flex-col w-1/3 -space-y-1">
				<span class="text-2xl font-bold">{{
					toLitteral(stats.followers)
				}}</span>
				<span class="text-muted">Abonnés</span>
			</div>
		</section>

		<section
			v-if="
				profile?.bio ||
				profile?.location ||
				profile?.corporation ||
				(profile?.links && profile?.links.length > 0)
			"
			class="flex flex-col gap-2 mt-4"
		>
			<p v-if="profile?.bio" class="text-muted px-4">{{ profile.bio }}</p>

			<ul
				v-if="profile?.location || profile?.corporation"
				class="space-y-1 px-4"
			>
				<li v-if="profile.location" class="flex items-center gap-1">
					<MapPinIcon class="w-5 h-5 text-muted" />
					{{ profile.location }}
				</li>

				<li v-if="profile.corporation" class="flex items-center gap-1">
					<BuildingOffice2Icon class="w-5 h-5 text-muted" />
					{{ profile.corporation }}
				</li>
			</ul>
		</section>
	</Teleport>

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
				<span class="text-2xl font-bold">{{ levelLabel }}</span>
				<span class="text-muted">Niveau</span>
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
					sanctions?.length ?? 0
				}}</span>
				<span class="text-muted">Sanctions & Avert.</span>
			</Box>
		</div>
	</section>

	<section v-if="tab === 'reports'" class="space-y-2">
		<div class="flex flex-col -space-y-1 px-8">
			<h2 class="text-2xl font-bold">Signalements</h2>
		</div>
		<FilterSelect
			id="report-status"
			v-model="reportStatus"
			label="Statut"
			:options="REPORT_STATUS_OPTIONS"
		/>
		<div
			v-if="visibleReports.length === 0 && !filteredReportsPending"
			class="px-8 text-muted"
		>
			Aucun signalement
			{{ reportStatus ? "avec ce statut" : "" }} pour
			{{ profile?.displayName ?? profile?.name }}
		</div>
		<div class="flex flex-col gap-2">
			<ProfileReportView
				v-for="report in visibleReports"
				:key="report.id"
				:data="report"
				:editable="false"
				:handlable="true"
			/>
		</div>
	</section>

	<section v-if="tab === 'sanctions'" class="space-y-2">
		<div class="flex flex-col -space-y-1 px-8">
			<div class="flex items-center">
				<h2 class="text-2xl font-bold">Sanctions</h2>
				<div class="grow"></div>
				<Button
					:handler="() => (tab = 'new_sanction')"
					label="Nouvelle sanction"
					size="small"
				/>
			</div>
		</div>
		<FilterSelect
			id="sanction-state"
			v-model="sanctionState"
			label="Statut"
			:options="SANCTION_STATE_OPTIONS"
		/>
		<div
			v-if="
				visibleSanctions.filter((s) => s.type != 'warning').length ===
					0 && !filteredSanctionsPending
			"
			class="px-8 text-muted"
		>
			Aucune sanction pour
			{{ profile?.displayName ?? profile?.name }}
		</div>
		<div class="flex flex-col gap-2">
			<SanctionView
				v-for="sanction in visibleSanctions.filter(
					(s) => s.type != 'warning',
				)"
				:key="sanction.id"
				:data="sanction"
			/>
		</div>
	</section>

	<section v-if="tab === 'warnings'" class="space-y-2">
		<div class="flex flex-col -space-y-1 px-8">
			<h2 class="text-2xl font-bold">Avertissements</h2>
		</div>
		<FilterSelect
			id="warning-state"
			v-model="sanctionState"
			label="Statut"
			:options="SANCTION_STATE_OPTIONS"
		/>
		<div
			v-if="
				visibleSanctions.filter((s) => s.type == 'warning').length ===
					0 && !filteredSanctionsPending
			"
			class="px-8 text-muted"
		>
			Aucun avertissement pour
			{{ profile?.displayName ?? profile?.name }}
		</div>
		<SanctionView
			v-for="sanction in visibleSanctions.filter(
				(s) => s.type == 'warning',
			)"
			:key="sanction.id"
			:data="sanction"
		/>
	</section>

	<section v-if="tab === 'new_sanction'" class="space-y-2">
		<div class="flex flex-col -space-y-1 px-8">
			<h2 class="text-2xl font-bold">Nouvelle sanction</h2>
		</div>
		<Box>
			<form class="flex flex-col gap-4" @submit.prevent="() => {}">
				<div class="flex flex-col gap-1">
					<label for="type" class="font-semibold"
						>Type de sanction</label
					>
					<select
						id="type"
						v-model="newSanction.type"
						class="bg-surface text-surface-text border border-surface-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
					>
						<option value="warning">Avertissement</option>
						<option value="shadow_ban">Shadow Ban</option>
						<option value="mute">Restriction</option>
						<option value="ban">Suspension</option>
					</select>
				</div>
				<Input
					v-model="newSanction.reason"
					label="Raison"
					placeholder="Raison de la sanction"
					required
				/>
				<Input
					v-model="newSanction.details"
					type="textarea"
					label="Détails"
					placeholder="Détails de la sanction"
					required
				/>
				<Input
					v-model="newSanction.expiresAt"
					label="Date d'expiration"
					placeholder="Date d'expiration de la sanction"
					type="datetime-local"
				/>
				<Button
					type="submit"
					label="Créer la sanction"
					size="medium"
					:handler="submitNewSanction"
				/>
			</form>
		</Box>
	</section>

	<BadgeInfo
		v-if="focusedBadge"
		:badge="focusedBadge"
		@close="focusedBadge = null"
	/>
</template>
