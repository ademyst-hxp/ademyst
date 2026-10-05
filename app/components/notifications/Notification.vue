<script setup lang="ts">
import type {
	AccountSanctionNotification,
	PostSanctionNotification,
	ReportNotification,
	PostNotification,
	WhisperNotification,
	FollowNotification,
} from "#shared/models/inbox";

import SanctionNotificationBox from "~/components/notifications/SanctionNotification.vue";
import FollowNotificationBox from "~/components/notifications/FollowNotification.vue";

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
</script>
<template>
	<SanctionNotificationBox
		v-if="'sanction' in data"
		:data="data"
		:scale="scale"
	/>
	<FollowNotificationBox
		v-else-if="'relationship' in data"
		:data="data"
		:scale="scale"
	/>
	<div v-else class="flex flex-col gap-2">
		<h4 class="text-lg font-medium font-title">
			Notification de type <code>{{ data.type }}</code>
		</h4>
		<p class="text-sm text-surface-text-muted">
			Contenu de la notification:
		</p>
		<pre class="text-sm text-surface-text-muted">
			{{ JSON.stringify(data, null, 2) }}
		</pre>
	</div>
</template>
