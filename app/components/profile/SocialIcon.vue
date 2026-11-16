<script setup lang="ts">
import { GlobeAltIcon } from "@heroicons/vue/24/outline";

import {
	getLinkTypeById,
	getLinkTypesByDomain,
	getLinkTypesByPlatform,
} from "~~/shared/consts/links";

const props = withDefaults(
	defineProps<{
		icon?: string;
		customColor?: string;
	}>(),
	{
		customColor: "",
	},
);

const icon = computed(() => {
	if (props.icon) {
		// Id de type (ex: "youtube_video"), puis domaine, puis plateforme (ex: "youtube")
		const type =
			getLinkTypeById(props.icon) ??
			getLinkTypesByDomain(props.icon)[0] ??
			getLinkTypesByPlatform(props.icon)[0] ??
			null;

		if (type?.icon) {
			return type.icon;
		}
	}

	return null;
});
</script>
<template>
	<img
		v-if="icon"
		:src="icon"
		:alt="`Icône de ${props.icon || 'site web'}`"
		class="object-cover"
	/>
	<GlobeAltIcon v-else />
</template>
