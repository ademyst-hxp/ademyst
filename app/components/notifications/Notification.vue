<script setup lang="ts">
import type { Notification } from "#shared/models/inbox";
import { NOTIFICATION_CATEGORY_META } from "~~/shared/consts/notifications";
import Box from "~/components/base/Box.vue";
import NotificationIcon from "~/components/notifications/NotificationIcon.vue";
import NotificationPreview from "~/components/notifications/NotificationPreview.vue";
import { convertToLitteralDuration } from "~/utils/date";
import {
	getNotificationActor,
	getNotificationDetails,
	getNotificationLink,
	getNotificationSeverity,
	getNotificationTitle,
	NOTIFICATION_ICONS,
	SEVERITY_TEXT,
} from "~/utils/notifications";

const props = defineProps<{
	data: Notification;
	// Par défaut : non lue au moment de la requête. La page peut le forcer
	// pour garder le repère après « tout marquer comme lu ».
	unread?: boolean;
}>();

const emit = defineEmits<{
	(e: "open", notification: Notification): void;
}>();

const details = computed(() => getNotificationDetails(props.data));
const interactive = computed(() => getNotificationLink(props.data) !== null);
const isUnread = computed(() => props.unread ?? !props.data.read);

const createdLabel = computed(() =>
	convertToLitteralDuration(new Date(props.data.createdAt), new Date()),
);

const open = () => {
	if (interactive.value) emit("open", props.data);
};
</script>
<template>
	<Box
		scale="md"
		layout="horizontal"
		class="gap-3"
		:class="[
			{ 'border-primary': isUnread },
			interactive
				? 'cursor-pointer transition-transform duration-200 hover:scale-101'
				: '',
		]"
		@click="open"
	>
		<NotificationIcon
			:actor="getNotificationActor(data)"
			:icon="NOTIFICATION_ICONS[data.type]"
			:tone="SEVERITY_TEXT[getNotificationSeverity(data)]"
		/>
		<div class="flex min-w-0 grow flex-col gap-2">
			<div class="flex items-start gap-2">
				<div class="min-w-0 grow">
					<p class="font-medium">{{ getNotificationTitle(data) }}</p>
					<p class="text-sm text-surface-text-muted">
						{{ NOTIFICATION_CATEGORY_META[data.category].label }}
						·
						{{ createdLabel }}
					</p>
				</div>
				<span
					v-if="isUnread"
					class="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary"
					aria-label="Non lue"
				/>
			</div>
			<ul
				v-if="details.length"
				class="flex flex-col text-sm text-surface-text-muted"
			>
				<li v-for="line in details" :key="line">{{ line }}</li>
			</ul>
			<NotificationPreview :data />
		</div>
	</Box>
</template>
