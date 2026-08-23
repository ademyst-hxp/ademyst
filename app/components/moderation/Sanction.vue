<script setup lang="ts">
import type { Sanction } from "~~/shared/models/sanctions";

import Box from "../base/Box.vue";

const props = withDefaults(
	defineProps<{
		data: Sanction;
		editable?: boolean;
	}>(),
	{
		editable: false,
	},
);

const label = computed(() => {
	switch (props.data.type) {
		case "warning":
			return "Avertissement";
		case "shadow_ban":
			return "Shadow Ban";
		case "mute":
			return "Restriction";
		case "ban":
			return "Suspension";
		default:
			return "Sanction";
	}
});
</script>
<template>
	<Box :key="'sanction-' + data.id" class="shrink-0">
		<div class="flex flex-col justify-center -space-y-1">
			<h3 class="text-xl font-bold">{{ label }} - {{ data.reason }}</h3>
			<span class="text-muted text-sm">
				{{
					new Date(data.createdAt).toLocaleString("fr-FR", {
						day: "2-digit",
						month: "long",
						year: "numeric",
						hour: "2-digit",
						minute: "2-digit",
					})
				}}
			</span>
		</div>
		<div
			class="bg-widget text-widget-text break-after-all wrap-break-word border-l-4 border-l-widget-border max-h-144 px-3 py-3 overflow-x-visible overflow-y-auto"
		>
			<p>{{ data.details }}</p>
		</div>
		<div class="flex flex-col justify-center">
			<p v-if="data.id" class="text-muted text-sm">
				Sanction n°<code>{{ data.id }}</code>
			</p>
			<p v-if="data.issuer" class="text-muted text-sm">
				Prononcée par <b>{{ data.issuer.email }}</b>
			</p>
			<p v-if="data.account" class="text-muted text-sm">
				Concernant <b>{{ data.account.email }}</b>
			</p>
			<p v-if="data.expiresAt" class="text-muted text-sm">
				Expire le
				<b>{{
					new Date(data.expiresAt).toLocaleString("fr-FR", {
						day: "2-digit",
						month: "long",
						year: "numeric",
						hour: "2-digit",
						minute: "2-digit",
					})
				}}</b>
			</p>
		</div>
	</Box>
</template>
