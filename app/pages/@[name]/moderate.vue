<script setup lang="ts">
import { BuildingOffice2Icon, MapPinIcon } from "@heroicons/vue/24/solid";

import type { Profile } from "~~/shared/models/profiles";
import type { Post } from "~~/shared/models/interactions";
import type { Sanction } from "~~/shared/models/sanctions";
import type { ProfileReport } from "~~/shared/models/reports";

import SanctionView from "~/components/moderation/Sanction.vue";
import Box from "~/components/base/Box.vue";

type ProfileResponse = {
	status: "ok";
	profile: Profile;
};

const route = useRoute();
const { $api } = useNuxtApp();

definePageMeta({
	middleware: ["auth", "moderation"],
});

const name = computed(() => {
	const raw = route.params.name;
	return Array.isArray(raw) ? raw[0] : raw;
});

const requestKey = computed(() => `profile-${name.value ?? "missing"}`);
const postsRequestKey = computed(() => `posts-${name.value ?? "missing"}`);

const { data, pending } = await useAsyncData(requestKey, async () => {
	if (!name.value) throw createError({ statusCode: 400 });

	return $api<ProfileResponse>(`/users/${encodeURIComponent(name.value)}`);
});

const { data: posts } = await useAsyncData(postsRequestKey, async () => {
	if (!name.value) throw createError({ statusCode: 400 });

	return (
		await $api<{ posts: Post[] }>(
			`/users/${encodeURIComponent(name.value)}/posts`,
		)
	).posts;
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

const profile = computed<Profile | null>(() => data.value?.profile ?? null);
const stats = computed(
	() => profile.value?.stats ?? { following: 0, followers: 0 },
);

const levelLabel = computed(() => {
	if (!profile.value) return "Inconnu";

	switch (profile.value.level) {
		case 0:
			return "Banni";
		case 1:
			return "Restreint";
		case 2:
			return "Invisible";
		case 3:
			return "Membre";
		case 4:
			return "Premium";
		case 5:
			return "Vérifié";
		case 6:
			return "Assist. Modération";
		case 7:
			return "Modérateur";
		case 8:
			return "Haut Gradé";
		case 9:
			return "Équipe Ademyst";
		default:
			return "Inconnu";
	}
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
</script>
<template>
	<div class="mx-auto max-w-7xl lg:flex lg:gap-8">
		<header
			class="p-6 px-8 space-y-6 md:p-8 lg:w-1/2 xl:w-1/3 lg:sticky lg:top-24 lg:self-start"
		>
			<div class="flex gap-4 items-center">
				<img
					src="/images/default_avatar.png"
					class="w-24 h-24 rounded-full"
				/>

				<div class="-space-y-2">
					<div
						v-if="pending"
						class="bg-muted rounded-full h-3 w-32 animate-pulse"
					/>

					<h1 v-else class="text-3xl font-bold">
						{{
							profile?.displayName ??
							(profile?.name ? `@${profile.name}` : "Ghost")
						}}
					</h1>

					<div
						v-if="pending"
						class="bg-muted rounded-full h-3 w-24 animate-pulse"
					/>

					<span v-else class="text-muted text-lg font-semibold">
						{{ `@${profile?.name ?? "ghost"}` }}
					</span>
				</div>
			</div>

			<div class="flex items-center gap-4 px-4">
				<div class="flex flex-col w-1/3 -space-y-1">
					<span class="text-2xl font-bold">{{
						posts?.length ?? 0
					}}</span>
					<span class="text-muted">Publications</span>
				</div>

				<div class="flex flex-col w-1/3 -space-y-1">
					<span class="text-2xl font-bold">{{
						stats.following
					}}</span>
					<span class="text-muted">Suivis</span>
				</div>

				<div class="flex flex-col w-1/3 -space-y-1">
					<span class="text-2xl font-bold">{{
						stats.followers
					}}</span>
					<span class="text-muted">Abonnés</span>
				</div>
			</div>

			<p v-if="profile?.bio" class="text-muted px-4">
				{{ profile.bio }}
			</p>

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
						<span class="text-2xl font-bold">{{ levelLabel }}</span>
						<span class="text-muted">Niveau</span>
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
							sanctions?.length ?? 0
						}}</span>
						<span class="text-muted">Sanctions & Avert.</span>
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
						Aucun signalement pour
						{{ profile?.displayName ?? profile?.name }}
					</div>
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
					<div
						v-if="
							!sanctions ||
							sanctions.filter((s) => s.type != 'warning')
								.length === 0
						"
						class="text-muted"
					>
						Aucune sanction pour
						{{ profile?.displayName ?? profile?.name }}
					</div>
				</div>
				<div class="flex flex-col gap-4">
					<SanctionView
						v-for="sanction in sanctions?.filter(
							(s) => s.type != 'warning',
						) ?? []"
						:key="sanction.id"
						:data="sanction"
					/>
				</div>
			</section>

			<section v-if="tab === 'warnings'" class="space-y-2">
				<div class="flex flex-col -space-y-1 px-8">
					<h2 class="text-2xl font-bold">Avertissements</h2>
					<div
						v-if="
							!sanctions ||
							sanctions.filter((s) => s.type == 'warning')
								.length === 0
						"
						class="text-muted"
					>
						Aucun avertissement pour
						{{ profile?.displayName ?? profile?.name }}
					</div>
				</div>
				<SanctionView
					v-for="sanction in sanctions?.filter(
						(s) => s.type == 'warning',
					) ?? []"
					:key="sanction.id"
					:data="sanction"
				/>
			</section>

			<section v-if="tab === 'new_sanction'" class="space-y-2">
				<div class="flex flex-col -space-y-1 px-8">
					<h2 class="text-2xl font-bold">Nouvelle sanction</h2>
				</div>
				<Box>
					<form
						class="flex flex-col gap-4"
						@submit.prevent="() => {}"
					>
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
		</main>
	</div>
</template>
