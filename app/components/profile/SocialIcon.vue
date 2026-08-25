<script setup lang="ts">
import { domains } from "~~/shared/consts/links";

import { GlobeAltIcon } from "@heroicons/vue/24/outline";

const props = withDefaults(defineProps<{
	icon?: string;
	customColor?: string;
}>(), {
	customColor: "",
});

const icon = computed(() => {
	if (props.icon) {
		const domain = Object.values(domains).find(
			(domain) => domain.name === props.icon,
		);

		if (domain && domain.icon) {
			return domain.icon;
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
