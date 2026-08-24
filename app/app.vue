<script setup lang="ts">
import Navbar from "./components/layout/Navbar.vue";
const { session } = useAuthSession();

const { theme, initTheme } = useTheme();

const route = useRoute();

const isAuthRoute = computed(() => route.path.startsWith("/auth"));

const _theme =
	theme.value === "system"
		? window?.matchMedia("(prefers-color-scheme: dark)")?.matches
			? "dark"
			: "light"
		: theme.value;

initTheme();

definePageMeta({
	bodyAttrs: {
		class: `scheme-${_theme}`,
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
