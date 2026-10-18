<script setup lang="ts">
import { ExclamationCircleIcon } from "@heroicons/vue/24/outline";

import type { Post } from "~~/shared/models/interactions";
import type { PostReport } from "~~/shared/models/reports";

import PostBox from "~/components/interactions/Post.vue";

import Box from "~/components/base/Box.vue";
import Table from "~/components/base/Table.vue";

import InfoBox from "~/components/boxes/Info.vue";

import { ratingScoreDetails } from "~~/shared/utils/interactions";

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
	title: "Statistiques de la publication | Ademyst",
	description: "Consultez les statistiques d'une publication sur Ademyst.",
	layout: "default",
	middleware: ["auth"],
});

useHead({
	title: `Statistiques de la publication | Ademyst`,
	meta: [
		{
			name: "description",
			content: `Consultez les statistiques de la publication de ${post.value?.profile?.displayName || "@" + post.value?.profile?.name || "@ghost"} sur Ademyst.`,
		},
		{
			name: "keywords",
			content: "Beam, Ademyst, Discover, Stats",
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

const tab = ref<"hit" | "details" | "flags">("hit");

const tabs = computed<{ name: string; value: string }[]>(() => {
	let _tabs = [
		{ name: "Hit Beam", value: "hit" },
		{ name: "Détails", value: "details" },
		{ name: "Flags", value: "flags" },
	];

	return _tabs;
});

/****************/
const details = computed(() => {
	if (!post.value)
		return {
			score: 0,
			dateMultiplier: 1,
			lengthMultiplier: 1,
			ethosMultiplier: 1,
			reactionScore: 0,
			repostScore: 0,
		};

	return ratingScoreDetails(
		post.value.createdAt,
		post.value.content,
		post.value.profile.level,
		post.value.stats,
	);
});

const getCoeffPenalty = (
	coeff: number | null = null,
	canExceedOne: boolean = false,
): "Green flag" | "Positif" | "Neutre" | "Pénalisant" | "Très pénalisant" => {
	if (coeff === null || coeff === undefined) return "Neutre";

	if (canExceedOne) {
		return coeff >= 2
			? "Green flag"
			: coeff >= 1.5
				? "Positif"
				: coeff >= 1
					? "Neutre"
					: coeff >= 0.5
						? "Pénalisant"
						: "Très pénalisant";
	} else {
		return coeff >= 1
			? "Green flag"
			: coeff >= 0.75
				? "Positif"
				: coeff >= 0.5
					? "Neutre"
					: coeff >= 0.25
						? "Pénalisant"
						: "Très pénalisant";
	}
};

const getRawPenalty = (amount: number | null, treshold: number): string => {
	if (amount === null || amount === undefined) return "Neutre";

	const coeff = amount / treshold;
	return getCoeffPenalty(coeff, true);
};

const getGradeLabel = (level: number | null): string => {
	if (level === null || level === undefined) return "Inconnu";

	switch (level) {
		case 0:
			return "Banni(e)";
		case 1:
			return "Shadow";
		case 2:
			return "Restreint(e)";
		case 3:
			return "Membre";
		case 4:
			return "Premium";
		case 5:
			return "Vérifié(e)";
		case 6:
			return "Aide Modération";
		case 7:
			return "Modérateur(trice)";
		case 8:
			return "Équipe Ademyst";
		case 9:
			return "Fondateur";
		default:
			return "Inconnu";
	}
};
</script>
<template>
	<Teleport to="#header">
		<h1 class="text-3xl font-bold text-center font-title">
			Statistiques de la publication
		</h1>
		<PostBox v-if="post" :data="post" />
		<div class="flex flex-col items-center justify-center py-16">
			<span class="text-sm text-muted">Score de recommandation</span>
			<span class="text-6xl font-bold font-title">{{
				post?.stats.score ?? 0
			}}</span>
		</div>
	</Teleport>

	<TabBar v-model="tab" :tabs="tabs" />

	<section v-if="tab === 'hit'" class="flex flex-col gap-2">
		<Box>
			<h3
				v-if="(post?.stats?.score ?? 0) >= 100"
				class="text-lg font-semibold"
			>
				Votre publication est un Hit Beam !
			</h3>
			<h3 v-else class="text-lg font-semibold">
				Votre publication n'est pas encore un Hit Beam.
			</h3>
			<div>
				<div class="flex justify-between items-end px-2">
					<span class="text-muted">0</span>
					<span class="text-primary">100*</span>
				</div>
				<div class="bg-slate-500/20 rounded-full h-4">
					<div
						class="bg-linear-to-br from-secondary to-primary h-4 rounded-full"
						:style="{
							width: Math.min(post?.stats.score ?? 0, 100) + '%',
						}"
					></div>
				</div>
			</div>
			<p class="text-surface-text-muted">
				*Ce palier n'est pas une limite théorique. Il sert à déterminer
				si une publication est un Hit Beam ou non. Une publication peut
				dépasser ce score.
			</p>
		</Box>
		<InfoBox>
			Une publication est un « Hit Beam » lorsqu'elle atteint un score de
			recommandation de 100. Cela signifie qu'elle répond un minimum au
			critères de qualité établis par Ademyst. Ces critères seront revus à
			la hausse ou à la baisse selon l'évolution de la plateforme et des
			retours de la communauté.
		</InfoBox>
	</section>

	<section v-if="tab === 'details'" class="flex flex-col gap-2">
		<h2 class="text-2xl font-semibold">Détails de la publication</h2>
		<div class="overflow-x-auto">
			<Table
				class="table-auto w-full border-collapse border border-surface-border"
			>
				<template #head>
					<th class="col-span-2 text-left">Critère</th>
					<th class="text-left">Valeur</th>
					<th class="text-left">Impact</th>
				</template>
				<template #body>
					<tr>
						<th>J'aime</th>
						<td>{{ post?.stats.reactions.like ?? 0 }}</td>
						<td>
							{{
								getRawPenalty(
									post?.stats.reactions.like ?? 0,
									1023,
								)
							}}
						</td>
					</tr>
					<tr>
						<th class="col-span-2">Ancienneté</th>
						<td>
							{{
								Math.round(
									(new Date().getTime() -
										new Date(
											post?.createdAt ?? 0,
										).getTime()) /
										(1000 * 60 * 60 * 24),
								)
							}}
							jours
						</td>
						<td>
							{{ getCoeffPenalty(details.dateMultiplier) }}
						</td>
					</tr>
					<tr>
						<th class="col-span-2">Grade</th>
						<td>{{ getGradeLabel(post?.profile.level ?? 0) }}</td>
						<td>
							{{ getCoeffPenalty(details.ethosMultiplier, true) }}
						</td>
					</tr>
					<tr>
						<th class="col-span-2">Longueur</th>
						<td>{{ post?.content.length ?? 0 }} caractères</td>
						<td>
							{{ getCoeffPenalty(details.lengthMultiplier) }}
						</td>
					</tr>
				</template>
			</Table>
		</div>
	</section>

	<section v-if="tab === 'flags'" class="flex flex-col gap-2">
		<h2 class="text-2xl font-semibold">Flags de la publication</h2>
		<p>
			Les flags sont des indicateurs qui signalent des problèmes ou des
			caractéristiques spécifiques d'une publication. Certains d'entre eux
			peuvent influencer la visibilité de votre publication, voire se
			substituer au score de recommandation.
		</p>
		<Table
			class="table-auto w-full border-collapse border border-surface-border"
		>
			<template #head>
				<th>Flag</th>
				<th>Activé</th>
			</template>
			<template #body>
				<tr>
					<th>NFE (contenu sensible)</th>
					<td
						v-if="post?.flags.NFE"
						class="flex items-center gap-0.5 text-danger!"
					>
						<ExclamationCircleIcon class="h-5 w-5" />
						Oui
					</td>
					<td v-else>Non</td>
				</tr>
				<tr>
					<th>Contenu généré par IA</th>
					<td
						v-if="post?.flags.AI"
						class="flex items-center gap-0.5 text-danger!"
					>
						<ExclamationCircleIcon class="h-5 w-5" />
						Oui
					</td>
					<td v-else>Non</td>
				</tr>
				<tr>
					<th>Contenu humoristique</th>
					<td
						v-if="post?.flags.joke"
						class="flex items-center gap-0.5 text-warning!"
					>
						<ExclamationCircleIcon class="h-5 w-5" />
						Oui
					</td>
					<td v-else>Non</td>
				</tr>
				<tr>
					<th>Désinformation</th>
					<td
						v-if="post?.flags.misinformation"
						class="flex items-center gap-0.5 text-danger!"
					>
						<ExclamationCircleIcon class="h-5 w-5" />
						Oui
					</td>
					<td v-else>Non</td>
				</tr>
				<tr>
					<th>Spam</th>
					<td
						v-if="post?.flags.spam"
						class="flex items-center gap-0.5 text-danger!"
					>
						<ExclamationCircleIcon class="h-5 w-5" />
						Oui
					</td>
					<td v-else>Non</td>
				</tr>
				<tr>
					<th>Contenu suspect</th>
					<td
						v-if="post?.flags.suspicious"
						class="flex items-center gap-0.5 text-warning!"
					>
						<ExclamationCircleIcon class="h-5 w-5" />
						Oui
					</td>
					<td v-else>Non</td>
				</tr>
				<tr>
					<th>Suicide ou auto-mutilation</th>
					<td
						v-if="post?.flags.suicide"
						class="flex items-center gap-0.5 text-warning!"
					>
						<ExclamationCircleIcon class="h-5 w-5" />
						Oui
					</td>
					<td v-else>Non</td>
				</tr>
				<tr>
					<th>Signalé massivement</th>
					<td
						v-if="post?.flags.reported"
						class="flex items-center gap-0.5 text-warning!"
					>
						<ExclamationCircleIcon class="h-5 w-5" />
						Oui
					</td>
					<td v-else>Non</td>
				</tr>
			</template>
		</Table>
	</section>
</template>
