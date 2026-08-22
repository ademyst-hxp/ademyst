<script setup lang="ts">
import type { Profile, ProfileLink } from "~~/shared/models/profiles";

import Box from "../base/Box.vue";

import Avatar from "./Avatar.vue";

const props = defineProps<{
	data: Profile;
	minified?: boolean;
}>();
</script>
<template>
	<div class="flex items-center gap-2" v-if="minified">
		<div class="flex items-center gap-2">
			<Avatar
				size="lg"
				:src="`/api/v1/users/${data?.name || 'ghost'}/avatar.webp`"
			/>
			<div class="flex flex-col -space-y-2">
				<span class="text-lg font-semibold">{{
					data.displayName || "@" + data.name
				}}</span>
				<span class="text-muted text-sm" v-if="data.displayName">
					@{{ data.name }}
				</span>
			</div>
		</div>
		<slot />
	</div>
	<Box v-else class="flex flex-col items-center gap-2 p-0">
		<Avatar
			size="lg"
			:src="`/api/v1/users/${data?.name || 'ghost'}/avatar.webp`"
		/>
		<span class="text-xl font-semibold">{{
			data.displayName || "@" + data.name
		}}</span>
		<span class="text-muted text-sm" v-if="data.displayName">
			@{{ data.name }}
		</span>
		<slot />
	</Box>
</template>
