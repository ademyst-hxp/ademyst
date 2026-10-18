<script setup lang="ts">
import { getNotificationType } from "~/utils/notifications";

import type { AccountSanctionNotification, FollowNotification, PostNotification, PostSanctionNotification, WhisperNotification } from "#shared/models/inbox";
import type { ReportNotification } from "#shared/models/inbox";

import FollowNotificationBox from "~/components/notifications/FollowNotification.vue";
import PostNotificationBox from "~/components/notifications/PostNotification.vue";
import SanctionNotificationBox from "~/components/notifications/SanctionNotification.vue";
import WhisperNotificationBox from "~/components/notifications/WhisperNotification.vue";

const props = withDefaults(
	defineProps<{
		scale?: "sm" | "md";
		data:
			| AccountSanctionNotification
			| PostSanctionNotification
			| ReportNotification
			| PostNotification
			| WhisperNotification
			| FollowNotification;
	}>(),
	{
		scale: "sm",
	},
);

const notifType = computed(() => getNotificationType(props.data));
</script>
<template>
	<SanctionNotificationBox
		v-if="notifType === 'account_sanction' || notifType === 'post_sanction'"
		:data="data as AccountSanctionNotification | PostSanctionNotification"
		:scale="scale"
	/>
	<FollowNotificationBox
		v-else-if="notifType === 'follow'"
		:data="data as FollowNotification"
		:scale="scale"
	/>
	<PostNotificationBox
		v-else-if="notifType === 'post'"
		:data="data as PostNotification"
		:scale="scale"
	/>
	<WhisperNotificationBox
		v-else-if="notifType === 'whisper'"
		:data="data as WhisperNotification"
		:scale="scale"
	/>
	<div v-else class="flex flex-col gap-2">
		<h4 class="text-lg font-medium font-title">
			Notification de type <code>{{ notifType }}</code>
		</h4>
		<p class="text-sm text-surface-text-muted">
			Contenu de la notification:
		</p>
		<pre class="text-sm text-surface-text-muted">
			{{ JSON.stringify(data, null, 2) }}
		</pre>
	</div>
</template>
