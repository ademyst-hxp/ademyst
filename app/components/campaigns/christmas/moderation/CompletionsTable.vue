<script setup lang="ts">
import type { ModerationCompletion } from "~~/shared/models/campaigns/christmas";

import Table from "~/components/base/Table.vue";
import ProfileRow from "~/components/profile/ProfileRow.vue";
import LevelLabel from "../common/LevelLabel.vue";

withDefaults(
	defineProps<{
		completions: ModerationCompletion[];
		loadingMore?: boolean;
	}>(),
	{
		loadingMore: false,
	},
);

// Les secondes comptent : le journal sert à repérer des rafales de validations.
const formatDate = (value: Date | string) =>
	new Date(value).toLocaleString("fr-FR", {
		day: "2-digit",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
</script>
<template>
	<div class="flex flex-col gap-2">
		<Table>
			<template #head>
				<tr>
					<th scope="col">Profil</th>
					<th scope="col">Quête</th>
					<th scope="col" class="text-right!">Points</th>
					<th scope="col">Validée le</th>
				</tr>
			</template>
			<template #body>
				<tr v-if="completions.length === 0">
					<td
						colspan="4"
						class="text-center text-surface-text/70!"
					>
						Aucune validation ne correspond à ces filtres.
					</td>
				</tr>
				<tr v-for="completion in completions" :key="completion.id">
					<td>
						<ProfileRow :data="completion.profile" />
					</td>
					<td>
						<div class="flex flex-col gap-1">
							<span class="font-semibold">
								Jour {{ completion.day }} · {{ completion.title }}
							</span>
							<LevelLabel :level="completion.level" />
						</div>
					</td>
					<td
						class="text-right font-bold tabular-nums text-primary!"
					>
						+{{ completion.reward }}
					</td>
					<td class="whitespace-nowrap tabular-nums">
						{{ formatDate(completion.completedAt) }}
					</td>
				</tr>
			</template>
		</Table>

		<p
			v-if="loadingMore"
			class="text-center text-sm text-muted"
			role="status"
		>
			Chargement…
		</p>

		<!-- Emplacement du sentinel de useScrollSentinel, posé par la page. -->
		<slot name="footer" />
	</div>
</template>
