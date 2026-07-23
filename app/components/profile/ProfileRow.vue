<script setup lang="ts">
import type { Profile } from '~~/shared/models/profiles';

import Avatar from './Avatar.vue';

const props = defineProps<{
	data?: Profile
}>();
</script>
<template>
	<div class="flex items-center gap-2">
		<Avatar />
		<div class="flex flex-col -space-y-1">
			<span class="font-semibold" v-if="data?.displayName">{{ data.displayName }}</span>
			<span class="text-muted text-sm" v-if="data?.name">@{{ data.name }}</span>
			<span class="text-muted text-sm" v-else>@ghost</span>
		</div>
	</div>
</template>
