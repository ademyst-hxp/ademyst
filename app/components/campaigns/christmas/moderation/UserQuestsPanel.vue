<script setup lang="ts">
import type {
	ModerationQuestsResponse,
	QuestState,
} from "~~/shared/models/campaigns/christmas";

import Box from "~/components/base/Box.vue";
import ProfileRow from "~/components/profile/ProfileRow.vue";
import QuestGrid from "../quests/QuestGrid.vue";
import QuestSummary from "../quests/QuestSummary.vue";
import ConfirmQuestAction from "./ConfirmQuestAction.vue";

const props = defineProps<{
	/** Réponse de GET /moderation/users/[id]/quests. */
	data: ModerationQuestsResponse;
	/** Niveau 8+ : seul·e à pouvoir valider ou retirer une quête. */
	canManage: boolean;
	/** POST …/quests/[day] : doit rejeter en cas d'échec. */
	validateQuest: (day: number) => Promise<void>;
	/** DELETE …/quests/[day] : doit rejeter en cas d'échec. */
	revokeQuest: (day: number) => Promise<void>;
}>();

const pendingAction = ref<{
	action: "validate" | "revoke";
	quest: QuestState;
} | null>(null);
const busy = ref(false);
const error = ref<string | null>(null);

const ask = (action: "validate" | "revoke", quest: QuestState) => {
	error.value = null;
	pendingAction.value = { action, quest };
};

const close = () => {
	pendingAction.value = null;
	error.value = null;
};

// La fenêtre ne se ferme qu'en cas de succès : sur une erreur, la personne
// voit le message et peut réessayer.
const confirm = async () => {
	const current = pendingAction.value;

	if (!current || busy.value) return;

	busy.value = true;
	error.value = null;

	try {
		if (current.action === "validate") {
			await props.validateQuest(current.quest.day);
		} else {
			await props.revokeQuest(current.quest.day);
		}

		close();
	} catch {
		error.value = "L'action a échoué. Vérifie tes droits et réessaie.";
	} finally {
		busy.value = false;
	}
};
</script>
<template>
	<section class="flex flex-col gap-2">
		<Box layout="horizontal" class="items-center">
			<ProfileRow :data="data.profile" />
		</Box>

		<QuestSummary :summary="data.summary" />

		<p
			v-if="!canManage"
			class="text-center text-sm text-muted"
		>
			Seuls les grades 8 et plus peuvent valider ou retirer une quête.
		</p>

		<!-- Les quêtes à venir sont en clair : c'est la vue modération. -->
		<QuestGrid :quests="data.data">
			<template v-if="canManage" #actions="{ quest }">
				<div class="flex justify-end">
					<Button
						v-if="quest.status === 'completed'"
						label="Retirer la validation"
						variant="danger"
						size="small"
						:handler="() => ask('revoke', quest)"
					/>
					<Button
						v-else
						label="Valider manuellement"
						size="small"
						:handler="() => ask('validate', quest)"
					/>
				</div>
			</template>
		</QuestGrid>

		<ConfirmQuestAction
			v-if="pendingAction"
			:action="pendingAction.action"
			:quest="pendingAction.quest"
			:profile="data.profile"
			:pending="busy"
			:error="error"
			@confirm="confirm"
			@cancel="close"
		/>
	</section>
</template>
