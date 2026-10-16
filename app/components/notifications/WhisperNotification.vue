<script setup lang="ts">
import type { WhisperNotification } from "#shared/models/inbox";
import Box from "~/components/base/Box.vue";

import WhisperIcon from "~/assets/whispers-feather.svg";

const props = withDefaults(
	defineProps<{
		scale?: "sm" | "md";
		data: WhisperNotification;
	}>(),
	{
		scale: "sm",
	},
);
</script>
<template>
	<Box :scale="scale" layout="horizontal" class="items-center">
		<template v-if="data.type == 'suggestion'">
			<WhisperIcon class="text-whispers w-6 h-6" />
			<h4 class="font-medium font-title">
				Cette pensée de
				<RouterLink :to="`/@${data.issuer.name}`">
					{{
						data.issuer.displayName ||
						`@${data.issuer.name}` ||
						"@ghost"
					}}
				</RouterLink>
				pourrait vous plaire
			</h4>
		</template>
		<template v-else-if="data.type == 'mention'">
			<WhisperIcon class="text-whispers w-6 h-6" />
			<h4 class="font-medium font-title">
				<RouterLink :to="`/@${data.issuer.name}`">
					{{
						data.issuer.displayName ||
						`@${data.issuer.name}` ||
						"@ghost"
					}}
				</RouterLink>
				vous a mentionné(e) dans une pensée
			</h4>
		</template>
		<template v-else-if="data.type == 'reply'">
			<WhisperIcon class="text-whispers w-6 h-6" />
			<h4 class="font-medium font-title">
				<RouterLink :to="`/@${data.issuer.name}`">
					{{
						data.issuer.displayName ||
						`@${data.issuer.name}` ||
						"@ghost"
					}}
				</RouterLink>
				vous a répondu avec une pensée
			</h4>
		</template>
		<template v-else-if="data.type == 'reaction'">
			<WhisperIcon class="text-whispers w-6 h-6" />
			<h4 class="font-medium font-title">
				<RouterLink :to="`/@${data.issuer.name}`">
					{{
						data.issuer.displayName ||
						`@${data.issuer.name}` ||
						"@ghost"
					}}
				</RouterLink>
				a aimé votre pensée
			</h4>
		</template>
		<template v-else-if="data.type == 'sanction'">
			<WhisperIcon class="text-whispers w-6 h-6" />
			<h4 class="font-medium font-title">
				Votre pensée a fait l'objet d'une sanction.
			</h4>
		</template>
		<div v-if="!data.read" class="bg-info rounded-full w-3 h-3 ml-auto"></div>
	</Box>
</template>
