<script setup lang="ts">
import {
	ClockIcon,
	LockClosedIcon,
	XCircleIcon,
} from "@heroicons/vue/24/outline";
import { CheckCircleIcon } from "@heroicons/vue/24/solid";

import type { QuestStatus } from "~~/shared/models/campaigns/christmas";

const props = defineProps<{
	status: QuestStatus;
}>();

// Pastille = icône + texte + contour : le sens ne repose jamais sur la couleur
// seule. Couleurs fixes : le libellé est toujours posé sur une carte de quête
// sombre et teintée (voir QuestCard). « Validée » est le seul état plein
// (fond blanc, icône pleine, gras) : c'est celui qu'on doit repérer d'un coup
// d'œil dans la grille.
const STATUSES: Record<
	QuestStatus,
	{ label: string; icon: Component; classes: string }
> = {
	completed: {
		label: "Validée",
		icon: CheckCircleIcon,
		classes: "bg-white text-[#0b3d1f] border-white font-bold shadow-md",
	},
	in_progress: {
		label: "Aujourd'hui",
		icon: ClockIcon,
		classes: "bg-[#f4c95d] text-[#2b1600] border-[#f4c95d] font-bold",
	},
	missed: {
		label: "Manquée",
		icon: XCircleIcon,
		classes: "bg-black/35 text-[#ffb3c1] border-[#ffb3c1]/60 font-semibold",
	},
	tomorrow: {
		label: "Demain",
		icon: LockClosedIcon,
		classes: "bg-black/25 text-[#f4c95d] border-[#f4c95d]/60 font-semibold",
	},
	locked: {
		label: "À venir",
		icon: LockClosedIcon,
		classes: "bg-black/25 text-white/75 border-white/20 font-medium",
	},
};

const meta = computed(() => STATUSES[props.status]);
</script>
<template>
	<span
		class="inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm leading-none"
		:class="meta.classes"
	>
		<component :is="meta.icon" class="h-4 w-4" aria-hidden="true" />
		{{ meta.label }}
	</span>
</template>
