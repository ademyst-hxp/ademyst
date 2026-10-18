<script setup lang="ts">
import type { PostNotification } from "#shared/models/inbox";
import Box from "~/components/base/Box.vue";
import PostCard from "../cards/PostCard.vue";

import {
	HeartIcon,
	FireIcon,
	AtSymbolIcon,
	ScaleIcon,
	ChatBubbleOvalLeftEllipsisIcon,
} from "@heroicons/vue/24/outline";

const props = withDefaults(
	defineProps<{
		scale?: "sm" | "md";
		data: PostNotification;
	}>(),
	{
		scale: "sm",
	},
);
</script>
<template>
	<Box :scale="scale">
		<div class="flex items-center gap-2">
			<template v-if="data.type == 'suggestion'">
				<FireIcon class="w-6 h-6" />
				<h4 class="font-medium font-title">
					Cette publication de
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
				<AtSymbolIcon class="w-6 h-6" />
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
				<ChatBubbleOvalLeftEllipsisIcon class="w-6 h-6" />
				<h4 class="font-medium font-title">
					<RouterLink :to="`/@${data.issuer.name}`">
						{{
							data.issuer.displayName ||
							`@${data.issuer.name}` ||
							"@ghost"
						}}
					</RouterLink>
					vous a répondu
				</h4>
			</template>
			<template v-else-if="data.type == 'reaction'">
				<HeartIcon class="w-6 h-6" />
				<h4 class="font-medium font-title">
					<RouterLink :to="`/@${data.issuer.name}`">
						{{
							data.issuer.displayName ||
							`@${data.issuer.name}` ||
							"@ghost"
						}}
					</RouterLink>
					a aimé votre publication
				</h4>
			</template>
			<template v-else-if="data.type == 'sanction'">
				<ScaleIcon class="w-6 h-6" />
				<h4 class="font-medium font-title">
					Votre publication a fait l'objet d'une sanction.
				</h4>
			</template>
			<div
				v-if="!data.read"
				class="bg-info rounded-full w-3 h-3 ml-auto"
			></div>
		</div>
		<PostCard :data="data.post" class="w-full -mx-2 mt-2" />
	</Box>
</template>
