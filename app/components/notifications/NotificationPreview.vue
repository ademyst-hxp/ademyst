<script setup lang="ts">
import type { Notification } from "#shared/models/inbox";
import Box from "~/components/base/Box.vue";
import PostCard from "~/components/cards/PostCard.vue";
import WhisperCard from "~/components/interactions/Whisper.vue";
import { getNotificationPreview } from "~/utils/notifications";

const props = defineProps<{
	data: Notification;
}>();

const { $md } = useNuxtApp();

const preview = computed(() => getNotificationPreview(props.data));
</script>
<template>
	<template v-if="preview">
		<PostCard
			v-if="preview.kind === 'post'"
			:data="preview.post"
			scale="sm"
			class="w-full"
		/>
		<WhisperCard
			v-else-if="preview.kind === 'whisper'"
			:data="preview.whisper"
			minified
			class="w-full"
		/>
		<Box
			v-else-if="preview.kind === 'reward'"
			scale="sm"
			layout="horizontal"
			class="items-center"
		>
			<img
				v-if="preview.badge"
				:src="`/api/v1/badges/${preview.badge.id}/icon.png`"
				:alt="preview.badge.name"
				class="h-10 w-10 shrink-0"
			/>
			<div class="min-w-0">
				<p v-if="preview.name" class="font-semibold">
					{{ preview.name }}
				</p>
				<p v-if="preview.badge" class="text-sm text-surface-text-muted">
					{{ preview.badge.name }}
				</p>
			</div>
		</Box>
		<Box v-else-if="preview.kind === 'announcement'" scale="sm">
			<!-- html: false côté markdown-it, le rendu est sûr -->
			<div
				class="line-clamp-4 text-sm"
				v-html="$md.render(preview.body)"
			/>
			<p v-if="preview.hasAction" class="text-sm font-medium text-primary">
				{{ preview.actionLabel || "En savoir plus" }}
			</p>
		</Box>
	</template>
</template>
