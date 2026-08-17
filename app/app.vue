<script setup lang="ts">
import Navbar from "./components/layout/Navbar.vue";
const { session } = useAuthSession();

const { theme } = useTheme();

definePageMeta({
	bodyAttrs: {
		class: `theme-${theme.value}`,
	},
});
</script>
<template>
	<Teleport to="#__nuxt">
		<Navbar v-if="session" />
	</Teleport>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>
