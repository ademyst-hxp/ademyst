<script setup lang="ts">
import Navbar from "./components/layout/Navbar.vue";
const { session } = useAuthSession();

const { theme } = useTheme();

const route = useRoute();

const isAuthRoute = route.path.startsWith("/auth");

definePageMeta({
	bodyAttrs: {
		class: `theme-${theme.value}`,
	},
});
</script>
<template>
	<Teleport to="#__nuxt">
		<Navbar v-if="session && !isAuthRoute" />
	</Teleport>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>
