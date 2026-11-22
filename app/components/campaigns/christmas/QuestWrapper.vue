<script setup lang="ts">
import type { QuestLevel } from "~~/shared/models/campaigns/christmas";

import FinalQuest from "./quests/FinalQuest.vue";
import NormalQuest from "./quests/NormalQuest.vue";
import SecondaryQuest from "./quests/SecondaryQuest.vue";
import SuperQuest from "./quests/SuperQuest.vue";
import UltraQuest from "./quests/UltraQuest.vue";

const props = withDefaults(
	defineProps<{
		level: QuestLevel;
		/** Quête verrouillée ou manquée : forme désaturée. */
		muted?: boolean;
	}>(),
	{
		muted: false,
	},
);

const SHAPES = {
	secondary: SecondaryQuest,
	normal: NormalQuest,
	super: SuperQuest,
	ultra: UltraQuest,
	final: FinalQuest,
} as const satisfies Record<QuestLevel, Component>;

// Couleur du texte (--quest-text) choisie pour le contraste avec la forme :
// le blanc par défaut ne passe que sur le rouge « ultra » (5,2:1 ; il tombe
// à 1,3:1 sur le vert et 2,5:1 sur le bleu).
const TEXT_COLORS: Record<QuestLevel, string> = {
	secondary: "#151D40",
	normal: "#151D40",
	super: "#151D40",
	ultra: "#FFFFFF",
	final: "#151D40",
};

const shape = computed(() => SHAPES[props.level]);
</script>
<template>
	<!--
		Le contenu du slot vit dans un <foreignObject> d'un viewBox 640×640 :
		les tailles de police y sont en unités du viewBox (≈100px pour un
		nombre à deux chiffres), pas en rem.
	-->
	<div
		class="aspect-square transition-[filter,opacity] duration-200"
		:class="muted ? 'grayscale opacity-60' : ''"
		:style="{ '--quest-text': TEXT_COLORS[level] }"
	>
		<component :is="shape" class="block w-full h-full" aria-hidden="true">
			<slot />
		</component>
	</div>
</template>
