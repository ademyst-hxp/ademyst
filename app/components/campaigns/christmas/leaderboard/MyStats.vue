<script setup lang="ts">
import type {
	LeaderboardPosition,
	QuestsReport,
} from "~~/shared/models/campaigns/christmas";

import Box from "~/components/base/Box.vue";
import ProgressBar from "../common/ProgressBar.vue";
import StatTile from "../common/StatTile.vue";

type StatsMilestone = {
	badgeId: string;
	/** Nom du badge (non fourni par le classement : à renseigner côté page). */
	name: string;
	minPoints: number;
};

const props = withDefaults(
	defineProps<{
		/** `me` du classement ; null si non connecté ou sans quête validée. */
		me: LeaderboardPosition | null;
		/** Nombre de participants (`total` du classement). */
		participants: number;
		/** `summary` de /quests : source la plus fiable pour les points. */
		summary?: QuestsReport["summary"] | null;
		/** Seuils de badges (50 / 75 / 100 pts aujourd'hui côté cron). */
		milestones?: StatsMilestone[];
		authenticated?: boolean;
	}>(),
	{
		summary: null,
		milestones: () => [],
		authenticated: true,
	},
);

const points = computed(() => props.summary?.points ?? props.me?.points ?? 0);
const completed = computed(
	() => props.summary?.completed ?? props.me?.completedQuests ?? 0,
);
const total = computed(() => props.summary?.total ?? 25);

const sortedMilestones = computed(() =>
	[...props.milestones].sort((a, b) => a.minPoints - b.minPoints),
);
</script>
<template>
	<section class="flex flex-col gap-2">
		<h2 class="text-2xl font-bold font-title text-center">
			Mes statistiques
		</h2>

		<Box v-if="!authenticated" class="items-center">
			<p class="text-center">
				Connecte-toi pour suivre ta progression et ta place dans le
				classement.
			</p>
			<slot name="login" />
		</Box>

		<template v-else>
			<div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
				<StatTile
					label="Classement"
					:value="me ? `#${me.rank}` : '—'"
					:hint="
						me
							? `sur ${participants} participant${participants > 1 ? 's' : ''}`
							: 'Valide une quête pour entrer au classement'
					"
				/>
				<StatTile
					label="Points"
					:value="points"
					hint="Cumulés sur toutes les quêtes validées"
				/>
				<StatTile
					label="Quêtes validées"
					:value="`${completed} / ${total}`"
				>
					<ProgressBar
						:value="completed"
						:max="total"
						label="Quêtes validées"
					/>
				</StatTile>
			</div>

			<Box
				v-if="sortedMilestones.length > 0"
				scale="sm"
			>
				<h3 class="text-lg font-bold font-title">Badges à gagner</h3>
				<ul class="flex flex-col gap-3">
					<li
						v-for="milestone in sortedMilestones"
						:key="milestone.badgeId"
						class="flex items-center gap-3"
					>
						<img
							:src="`/api/v1/badges/${milestone.badgeId}/icon.png`"
							:alt="`Badge ${milestone.name}`"
							class="h-12 w-12 shrink-0"
						/>
						<div class="grow min-w-0 flex flex-col gap-1">
							<div class="flex items-baseline justify-between gap-2">
								<span class="font-medium truncate">
									{{ milestone.name }}
								</span>
								<span
									class="shrink-0 text-sm text-surface-text/70"
								>
									{{
										points >= milestone.minPoints
											? "Seuil atteint"
											: `${milestone.minPoints - points} pts restants`
									}}
								</span>
							</div>
							<ProgressBar
								:value="points"
								:max="milestone.minPoints"
								:label="`Progression vers ${milestone.name} (${milestone.minPoints} points)`"
							/>
						</div>
					</li>
				</ul>
			</Box>
		</template>
	</section>
</template>
