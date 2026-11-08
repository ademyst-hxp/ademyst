<script setup lang="ts">
import {
	ArrowTopRightOnSquareIcon,
	XMarkIcon,
} from "@heroicons/vue/24/outline";

import { ATTACHMENT_TYPES } from "~~/shared/consts/attachments";
import { getLinkDomain } from "~~/shared/utils/attachments";

import type { Attachment } from "~~/shared/models/drive";

import SocialIcon from "../profile/SocialIcon.vue";
import Box from "../base/Box.vue";

// Bannière des Attachments hors média (lien, audio, fichier non pris en charge),
// affichée sous la publication comme les bannières des flags.
const props = withDefaults(
	defineProps<{
		data: Attachment;
		preview?: boolean;
	}>(),
	{
		preview: false,
	},
);

const emit = defineEmits<{
	(e: "remove"): void;
}>();

const meta = computed(() => ATTACHMENT_TYPES[props.data.type]);

const linkInfo = computed(() =>
	props.data.type === "link" ? getLinkDomain(props.data.link) : null,
);

const title = computed(() => {
	if (props.data.type === "link") {
		return linkInfo.value?.domain?.title || linkInfo.value?.hostname;
	}

	return props.data.altText || meta.value.label;
});
</script>
<template>
	<Box layout="horizontal" scale="sm" class="items-center">
		<SocialIcon
			v-if="data.type === 'link'"
			:icon="linkInfo?.domain?.name"
			class="h-6 w-6 shrink-0"
		/>
		<component :is="meta.icon" v-else class="h-6 w-6 shrink-0" />

		<div class="flex min-w-0 grow flex-col gap-1">
			<template v-if="data.type === 'audio'">
				<p class="text-sm font-semibold">{{ title }}</p>
				<Audio :src="data.link" class="w-full" />
			</template>
			<a
				v-else
				:href="data.link"
				target="_blank"
				rel="noopener noreferrer nofollow ugc"
				class="flex min-w-0 flex-col hover:underline"
			>
				<span class="truncate text-sm font-semibold">{{ title }}</span>
				<span class="truncate text-xs opacity-80">{{ data.link }}</span>
			</a>
		</div>

		<ArrowTopRightOnSquareIcon
			v-if="data.type !== 'audio' && !preview"
			class="h-5 w-5 shrink-0"
		/>
		<Button
			v-if="preview"
			:icon="XMarkIcon"
			variant="link"
			size="small"
			:handler="() => emit('remove')"
		/>
	</Box>
</template>
