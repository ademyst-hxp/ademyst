<script setup lang="ts">
import type { Badge } from "~~/shared/models/shop";

import Popup from "~/components/base/Popup.vue";
import Box from "~/components/base/Box.vue";

import RarityLabel from "~/components/shop/RarityLabel.vue";

const props = defineProps<{
	badge: Badge;
}>();

const emit = defineEmits<{
	(e: "close"): void;
}>();

const close = () => {
	emit("close");
};
</script>
<template>
	<Popup @close="close">
		<Box class="w-full sm:w-lg">
			<img
				:src="`/api/v1/badges/${props.badge.id}/icon.png`"
				:alt="props.badge.name"
				class="h-16 w-16"
			/>
			<div class="flex flex-col">
				<h2 class="flex justify-start items-center gap-2 text-2xl font-semibold">
					{{ props.badge.name }}
					<RarityLabel :rarity="props.badge.rarity" />
				</h2>
				<p class="text-surface-text-muted">
					{{ props.badge.description }}
				</p>
			</div>
			<Button label="Fermer" :handler="close" variant="link" />
		</Box>
	</Popup>
</template>
