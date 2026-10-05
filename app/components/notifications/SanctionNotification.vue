<script setup lang="ts">
import type {
	AccountSanctionNotification,
	PostSanctionNotification,
} from "#shared/models/inbox";

import Box from "~/components/base/Box.vue";

import PostCard from "~/components/cards/PostCard.vue";
import SanctionCard from "~/components/cards/SanctionCard.vue";

import { ScaleIcon } from "@heroicons/vue/24/outline";

const props = withDefaults(
	defineProps<{
		scale?: "sm" | "md";
		data: AccountSanctionNotification | PostSanctionNotification;
	}>(),
	{
		scale: "sm",
	},
);
</script>
<template>
	<Box :scale="scale" layout="horizontal">
		<div
			class="flex items-center justify-center bg-warning/15 text-warning rounded-full w-12 h-12 mt-2 mr-3 md:w-18 md:h-18"
		>
			<ScaleIcon class="w-6 h-6 md:w-9 md:h-9" />
		</div>

		<div class="grow flex flex-col gap-2">
			<h4 class="text-lg font-medium font-title" v-if="data.updatedAt">
				Votre sanction a été modifiée
			</h4>
			<h4 class="text-lg font-medium font-title" v-else>
				Vous avez reçu une sanction
			</h4>
			<SanctionCard :data="data.sanction" class="w-full" />
			<p v-if="'post' in data" class="text-sm text-surface-text-muted">
				Voici la publication concernée:
			</p>
			<PostCard v-if="'post' in data" :data="data.post" />
			<ul class="text-sm text-surface-text-muted">
				<li>
					Sanction délivrée:
					{{
						data.sanction.createdAt.toLocaleString("fr-FR", {
							year: "numeric",
							month: "long",
							day: "numeric",
						})
					}}
				</li>
				<li v-if="data.sanction.expiresAt">
					Effective jusqu'à:
					{{
						data.sanction.expiresAt.toLocaleString("fr-FR", {
							year: "numeric",
							month: "long",
							day: "numeric",
						})
					}}
				</li>
			</ul>
		</div>
		<div
			v-if="!data.read"
			class="bg-warning rounded-full w-3 h-3 ml-4"
		></div>
	</Box>
</template>
