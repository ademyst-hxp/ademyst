<script setup lang="ts">
import {
	CheckCircleIcon,
	ClockIcon,
	LockClosedIcon,
	XCircleIcon,
} from "@heroicons/vue/24/outline";

import type { QuestStatus } from "~~/shared/models/campaigns/christmas";

const props = defineProps<{
	status: QuestStatus;
}>();

// Couleurs fixes (pas de tokens de thème) : le libellé est toujours posé sur
// L'icône et le texte portent le sens, la
// couleur n'est qu'un renfort.
const STATUSES: Record<
	QuestStatus,
	{ label: string; icon: Component; color: string }
> = {
	completed: {
		label: "Validée",
		icon: CheckCircleIcon,
		color: "text-success",
	},
	in_progress: {
		label: "Aujourd'hui",
		icon: ClockIcon,
		color: "text-primary",
	},
	missed: {
		label: "Manquée",
		icon: XCircleIcon,
		color: "text-[#ff8fa8]",
	},
	locked: {
		label: "À venir",
		icon: LockClosedIcon,
		color: "text-surface-text/70",
	},
};

const meta = computed(() => STATUSES[props.status]);
</script>
<template>
	<span
		class="inline-flex items-center gap-1 text-sm font-semibold"
		:class="meta.color"
	>
		<component :is="meta.icon" class="h-4 w-4" aria-hidden="true" />
		{{ meta.label }}
	</span>
</template>
