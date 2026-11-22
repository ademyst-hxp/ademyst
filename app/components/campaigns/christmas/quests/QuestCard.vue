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

const formatDate = (value: Date | string) =>
	new Date(value).toLocaleString("fr-FR", {
		day: "numeric",
		month: "long",
		hour: "2-digit",
		minute: "2-digit",
	});

const muted = computed(
	() => props.quest.status === "locked" || props.quest.status === "missed",
);

// Titre et description valent null tant que la quête est verrouillée
// (sauf pour la modération, qui les reçoit en clair).
const unlockLabel = computed(
	() => `le ${props.quest.day === 1 ? "1er" : props.quest.day} décembre`,
);
</script>
<template>
	<Box
		scale="sm"
		class="h-full"
	>
		<div class="flex items-center gap-3">
			<QuestWrapper
				:level="quest.level"
				:muted="muted"
				class="h-20 w-20 shrink-0"
			>
				<span
					class="font-title font-extrabold leading-none"
					style="font-size: 110px"
					aria-hidden="true"
				>
					{{ quest.day }}
				</span>
			</QuestWrapper>

			<div class="grow min-w-0 flex flex-col gap-1">
				<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
					<LevelLabel :level="quest.level" />
					<QuestStatusLabel :status="quest.status" />
				</div>
				<h3 class="text-lg font-bold font-title leading-tight">
					<span class="sr-only">Jour {{ quest.day }} : </span>
					{{ quest.title ?? "Quête secrète" }}
				</h3>
			</div>
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

		<div
			class="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 text-sm"
		>
			<span class="font-semibold text-primary">
				{{ quest.status === "completed" ? "+" : "" }}{{ quest.reward }}
				pts
			</span>
			<span
				v-if="quest.completedAt"
				class="text-surface-text-muted"
			>
				Validée le {{ formatDate(quest.completedAt) }}
			</span>
			<span
				v-else-if="quest.status === 'in_progress' && quest.expiresAt"
				class="text-surface-text-muted"
			>
				Expire le {{ formatDate(quest.expiresAt) }}
			</span>
		</div>

		<!-- Actions de modération (valider / retirer) : fournies par la page. -->
		<slot name="actions" :quest="quest" />
	</Box>
</template>
