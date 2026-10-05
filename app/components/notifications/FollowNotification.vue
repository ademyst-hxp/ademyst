<script setup lang="ts">
import type { FollowNotification } from "#shared/models/inbox";
import Box from "~/components/base/Box.vue";

import { ClockIcon, UserPlusIcon } from "@heroicons/vue/24/outline";

const props = withDefaults(
	defineProps<{
		scale?: "sm" | "md";
		data: FollowNotification;
	}>(),
	{
		scale: "sm",
	},
);
</script>
<template>
	<Box :scale="scale" layout="horizontal" class="items-center">
		<template v-if="data.type == 'request'">
			<ClockIcon class="w-6 h-6" />
			<h4 class="font-medium font-title">
				<RouterLink :to="`/@${data.issuer.name}`">
					{{
						data.issuer.displayName ||
						`@${data.issuer.name}` ||
						"@ghost"
					}}
				</RouterLink>
				demande à vous suivre
			</h4>
		</template>
		<template v-else-if="data.type == 'request_accepted'">
			<ClockIcon class="w-6 h-6" />
			<h4 class="font-medium font-title">
				<RouterLink :to="`/@${data.issuer.name}`">
					{{
						data.issuer.displayName ||
						`@${data.issuer.name}` ||
						"@ghost"
					}}
				</RouterLink>
				a accepté votre demande de suivi
			</h4>
		</template>
		<template v-else-if="data.type == 'happened'">
			<UserPlusIcon class="w-6 h-6" />
			<h4 class="font-medium font-title">
				<RouterLink :to="`/@${data.issuer.name}`">
					{{
						data.issuer.displayName ||
						`@${data.issuer.name}` ||
						"@ghost"
					}}
				</RouterLink>
				a commencé à vous suivre
			</h4>
		</template>
		<div v-if="!data.read" class="bg-info rounded-full w-3 h-3 ml-auto"></div>
	</Box>
</template>
