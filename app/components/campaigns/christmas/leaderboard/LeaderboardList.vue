<script setup lang="ts">
import type { LeaderboardEntry } from "~~/shared/models/campaigns/christmas";

import Box from "~/components/base/Box.vue";
import LeaderboardRow from "./LeaderboardRow.vue";

withDefaults(
	defineProps<{
		entries: LeaderboardEntry[];
		/** Profil de la personne connectée (session.profile.id), pour sa ligne. */
		currentProfileId?: string | null;
		loadingMore?: boolean;
	}>(),
	{
		currentProfileId: null,
		loadingMore: false,
	},
);
</script>
<template>
	<Box layout="vertical-divide" class="overflow-hidden">
		<p
			v-if="entries.length === 0"
			class="p-6 text-center text-surface-text/70"
		>
			Personne n'est encore classé : le classement apparaîtra dès la
			première quête validée.
		</p>

		<!-- Les doublons de rang sont normaux (égalité de points) : la clé est le profil. -->
		<LeaderboardRow
			v-for="entry in entries"
			:key="entry.profile.id"
			:entry="entry"
			:highlighted="entry.profile.id === currentProfileId"
		/>

		<p
			v-if="loadingMore"
			class="p-4 text-center text-sm text-surface-text/70"
			role="status"
		>
			Chargement…
		</p>

		<!-- Emplacement du sentinel de useScrollSentinel, posé par la page. -->
		<slot name="footer" />
	</Box>
</template>
