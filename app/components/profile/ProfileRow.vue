<script setup lang="ts">
import type { Profile } from "~~/shared/models/profiles";

import Avatar from "./Avatar.vue";

const props = defineProps<{
	data?: Profile;
}>();
</script>
<template>
	<div
		class="cursor-pointer flex items-center gap-2"
		@click="$router.push(`/@${data?.name || 'ghost'}`)"
	>
		<Avatar
			:src="'/api/v1/users/' + (data?.name || 'ghost') + '/avatar.webp'"
		/>
		<div class="flex flex-col -space-y-1">
			<span class="flex items-center gap-1 font-semibold" v-if="data?.displayName"
				>{{ data.displayName }}
				<img
					v-if="data?.badge"
					:src="`/api/v1/badges/${data?.badge?.id}/icon.png`"
					:alt="data?.badge?.name"
					class="h-4 w-4"
			/></span>
			<span class="text-muted text-sm" v-if="data?.name"
				>@{{ data.name }}</span
			>
			<span class="text-muted text-sm" v-else>@ghost</span>
		</div>
	</div>
</template>
