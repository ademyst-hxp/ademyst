<script setup lang="ts">
import type { QuestState } from "~~/shared/models/campaigns/christmas";

import Box from "~/components/base/Box.vue";
import LevelLabel from "../common/LevelLabel.vue";
import ProgressBar from "../common/ProgressBar.vue";
import QuestStatusLabel from "../common/QuestStatusLabel.vue";
import QuestWrapper from "../QuestWrapper.vue";

const props = defineProps<{
	quest: QuestState;
}>();

/*
 * Un design par niveau. La couleur d'accent est celle de la forme du badge
 * (voir quests/*Quest.vue) ; chaque niveau a son propre « poids » visuel :
 *   - from / to : part d'accent dans le dégradé du fond (le reste est un bleu
 *     nuit, ce qui garantit un texte blanc lisible quelle que soit la teinte) ;
 *   - border : épaisseur du contour ;
 *   - glow : intensité du halo (0 = aucun).
 * Plus le niveau est élevé, plus la carte est dense et lumineuse.
 */
const BASE = "#0b1020";
const LEVEL_DESIGN: Record<
	QuestState["level"],
	{ accent: string; from: number; to: number; border: number; glow: number }
> = {
	secondary: { accent: "#56FC7F", from: 28, to: 14, border: 1, glow: 0 },
	normal: { accent: "#1AABFF", from: 38, to: 18, border: 1, glow: 10 },
	super: { accent: "#FB1AFF", from: 40, to: 18, border: 2, glow: 22 },
	ultra: { accent: "#DB0016", from: 46, to: 20, border: 2, glow: 30 },
	final: { accent: "#C89938", from: 44, to: 20, border: 3, glow: 36 },
};

const mix: any = (color: string, percent: number, into = BASE) =>
	`color-mix(in srgb, ${color} ${percent}%, ${into})`;

const boxStyle = computed(() => {
	const design = LEVEL_DESIGN[props.quest.level];
	const a = design.accent;
	// Quêtes à venir ou manquées : même design, mais éteint.
	const from = muted.value ? 12 : design.from;
	const to = muted.value ? 6 : design.to;

	const shadows: string[] = [];
	if (today.value) shadows.push("0 0 0 2px #f4c95d");
	if (!muted.value && design.glow > 0) {
		shadows.push(`0 0 ${design.glow}px -6px ${a}`);
	}
	if (!muted.value && props.quest.level === "final") {
		shadows.push(
			"inset 0 1px 0 rgb(255 255 255 / 0.35)",
			`inset 0 0 0 4px ${mix(a, 22, "transparent")}`,
		);
	}

	return {
		background: `linear-gradient(155deg, ${mix(a, from)}, ${mix(a, to)})`,
		borderColor: mix(a, muted.value ? 25 : 75, "transparent"),
		borderWidth: `${design.border}px`,
		borderStyle:
			props.quest.status === "locked" || props.quest.status === "tomorrow"
				? "dashed"
				: "solid",
		boxShadow: shadows.length ? shadows.join(", ") : "none",
		color: "#ffffff",
		// Les cartes sont toujours sombres : on redéfinit localement les jetons
		// de texte pour que LevelLabel, ProgressBar… restent lisibles en thème
		// clair.
		"--color-surface-text": "#ffffff",
		"--color-surface-text-muted": "rgb(255 255 255 / 0.78)",
		"--color-surface-border": "rgb(255 255 255 / 0.22)",
		"--color-muted-background": "rgb(255 255 255 / 0.14)",
		"--color-primary": "#f4c95d",
	};
});

const formatDate = (value: Date | string) =>
	new Date(value).toLocaleString("fr-FR", {
		day: "numeric",
		month: "long",
		hour: "2-digit",
		minute: "2-digit",
	});

const muted = computed(
	() =>
		props.quest.status === "locked" ||
		props.quest.status === "tomorrow" ||
		props.quest.status === "missed",
);

const completed = computed(() => props.quest.status === "completed");
const today = computed(() => props.quest.status === "in_progress");

const title = computed(() => props.quest.title ?? "Quête secrète");

// Titre et description valent null tant que la quête est verrouillée
// (sauf pour la modération, qui les reçoit en clair).
const unlockLabel = computed(
	() => `le ${props.quest.day === 1 ? "1er" : props.quest.day} décembre`,
);
</script>
<template>
	<Box scale="sm" class="h-full" :style="boxStyle">
		<QuestWrapper :level="quest.level" :muted="muted" class="h-20 w-20 mx-auto">
			<span
				class="font-title font-extrabold leading-none"
				style="font-size: 110px"
				aria-hidden="true"
			>
				{{ quest.day }}
			</span>
		</QuestWrapper>

		<div class="flex min-w-0 flex-col items-start gap-1.5">
			<h3
				class="w-full wrap-break-word text-lg font-bold font-title text-center leading-tight line-clamp-2"
				:title="title"
			>
				<span class="sr-only">Jour {{ quest.day }} : </span>
				{{ title }}
			</h3>
		</div>

		<p class="text-sm text-surface-text-muted">
			<template v-if="quest.description">
				{{ quest.description }}
			</template>
			<template v-else>
				Cette quête se dévoilera {{ unlockLabel }}.
			</template>
		</p>

		<ProgressBar
			v-if="quest.progress"
			:value="quest.progress.current"
			:max="quest.progress.target"
			:label="`Progression de la quête du jour ${quest.day}`"
			show-value
		/>

		<!--
			Pied : toujours collé en bas de la carte (mt-auto), donc aligné d'une
			carte à l'autre. Statut + date à gauche, points à droite.
		-->
		<footer
			class="mt-auto flex items-end justify-between gap-3 border-t border-surface-border pt-3"
		>
			<div class="flex min-w-0 flex-col items-start gap-1">
				<QuestStatusLabel :status="quest.status" />
				<span
					v-if="quest.completedAt"
					class="text-xs text-surface-text-muted"
				>
					Le {{ formatDate(quest.completedAt) }}
				</span>
				<span
					v-else-if="
						quest.status === 'in_progress' && quest.expiresAt
					"
					class="text-xs text-surface-text-muted"
				>
					Expire le {{ formatDate(quest.expiresAt) }}
				</span>
			</div>

			<span
				class="shrink-0 font-title font-bold leading-none text-primary tabular-nums"
			>
				<span class="text-2xl">{{ quest.reward }}</span>
				<span class="ml-1 text-sm">pts</span>
			</span>
		</footer>

		<!-- Actions de modération (valider / retirer) : fournies par la page. -->
		<slot name="actions" :quest="quest" />
	</Box>
</template>
