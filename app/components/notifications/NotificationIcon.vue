<script setup lang="ts">
import type { Component } from "vue";

import type { Profile } from "~~/shared/models/profiles";
import Avatar from "~/components/profile/Avatar.vue";

defineProps<{
	actor: Profile | null;
	icon: Component;
	// Classe de couleur du texte (gravité)
	tone?: string;
}>();
</script>
<template>
	<NuxtLink
		v-if="actor"
		:to="`/@${actor.name}`"
		class="shrink-0"
		:aria-label="`Profil de ${actor.displayName || actor.name}`"
		@click.stop
	>
		<Avatar :src="`/api/v1/users/${actor.name}/avatar.webp`" size="md" />
	</NuxtLink>
	<div
		v-else
		class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted-background"
		:class="tone"
	>
		<component :is="icon" class="h-8 w-8" />
	</div>
</template>
