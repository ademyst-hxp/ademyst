<script setup lang="ts">
import { useId } from "vue";

import type { Profile } from "~~/shared/models/profiles";
import type { QuestState } from "~~/shared/models/campaigns/christmas";

import Box from "~/components/base/Box.vue";
import Popup from "~/components/base/Popup.vue";
import Warning from "~/components/boxes/Warning.vue";

const props = withDefaults(
	defineProps<{
		action: "validate" | "revoke";
		quest: QuestState;
		profile: Profile;
		/** Requête en cours : les boutons sont désactivés. */
		pending?: boolean;
		/** Message d'erreur de la dernière tentative. */
		error?: string | null;
	}>(),
	{
		pending: false,
		error: null,
	},
);

const emit = defineEmits<{
	(e: "confirm"): void;
	(e: "cancel"): void;
}>();

const titleId = `confirm-quest-${useId()}`;

const isValidate = computed(() => props.action === "validate");

// Ces avertissements reprennent les limites documentées des routes
// POST/DELETE /moderation/users/[id]/quests/[day].
const warning = computed(() =>
	isValidate.value
		? {
				title: "Hors règle du jour",
				text: "La validation manuelle ignore la règle « pendant son jour ». Si la distribution des badges (24 décembre, 23:59 UTC) est déjà passée, aucun badge ne sera attribué.",
			}
		: {
				title: "Badges déjà distribués",
				text: "Les points du profil baissent dans le classement. Un badge déjà distribué par le cron n'est pas retiré : il faut le retirer séparément.",
			},
);

const cancel = () => {
	if (!props.pending) emit("cancel");
};

const onKeydown = (event: KeyboardEvent) => {
	if (event.key === "Escape") cancel();
};

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>
<template>
	<Popup @close="cancel">
		<Box
			class="w-full max-h-full overflow-y-auto sm:w-lg"
			role="dialog"
			aria-modal="true"
			:aria-labelledby="titleId"
		>
			<h2 :id="titleId" class="text-xl font-bold font-title sm:text-2xl">
				{{ isValidate ? "Valider" : "Retirer" }} la quête du jour
				{{ quest.day }} pour @{{ profile.name }} ?
			</h2>
			<p class="text-surface-text/80">
				{{ quest.title ?? "Quête secrète" }} ·
				{{ quest.reward }} pts
			</p>

			<Warning :title="warning.title">{{ warning.text }}</Warning>

			<p v-if="error" class="text-[#ff8fa8] font-medium" role="alert">
				{{ error }}
			</p>

			<div class="flex items-center justify-end gap-3">
				<Button
					label="Annuler"
					variant="white"
					size="small"
					:disabled="pending"
					:handler="cancel"
				/>
				<Button
					:label="isValidate ? 'Valider la quête' : 'Retirer la validation'"
					:variant="isValidate ? 'primary' : 'danger'"
					size="small"
					:disabled="pending"
					:handler="() => emit('confirm')"
				/>
			</div>
		</Box>
	</Popup>
</template>
