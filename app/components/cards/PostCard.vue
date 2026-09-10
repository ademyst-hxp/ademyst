<script setup lang="ts">
import type { Post, PostFlag } from "~~/shared/models/interactions";

import Card from "../base/Card.vue";

import ProfileRow from "../profile/ProfileRow.vue";

import {
	FlagIcon,
	TrashIcon,
	PencilIcon,
	HeartIcon,
	ChatBubbleOvalLeftEllipsisIcon,
	PaperAirplaneIcon,
	BookmarkIcon,
} from "@heroicons/vue/24/outline";

const props = defineProps<{
	data: Post;
}>();
const { $md } = useNuxtApp();

const rendered = computed(() => {
	return $md.render(props.data.content);
});
</script>
<template>
	<Card :key="'post-' + data.id" class="shrink-0">
		<div class="flex items-center">
			<ProfileRow :data="data.profile" />
		</div>
		<div
			class="break-after-all wrap-break-word post-content -mx-2 max-h-72 overflow-x-visible overflow-y-auto"
			v-html="rendered"
		/>
		<div class="flex flex-col gap-2" v-if="data.flags.NFE || data.flags.AI">
			<div
				v-if="data.flags.AI"
				class="flex items-center gap-2 bg-warning/20 text-warning border border-warning/40 rounded-xl p-4 -mx-2"
			>
				<p class="text-sm font-semibold">
					Cette publication peut contenir du contenu généré par une
					intelligence artificielle.
				</p>
			</div>
			<div
				v-if="data.flags.NFE"
				class="flex items-center gap-2 bg-warning/20 text-warning border border-warning/40 rounded-xl p-4 -mx-2"
			>
				<p class="text-sm font-semibold">
					Cette publication peut contenir des propos ou du contenu
					choquant pour un jeune public.
				</p>
			</div>
		</div>
	</Card>
</template>
