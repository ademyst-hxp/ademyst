<script setup lang="ts">
import Navbar from "./components/layout/Navbar.vue";
const { session } = useAuthSession();

const { theme, setTheme, initTheme } = useTheme();
const { $theme } = useNuxtApp();

const route = useRoute();

const isAuthRoute = computed(() => route.path.startsWith("/auth"));

const _theme =
	theme.value === "system"
		? window?.matchMedia("(prefers-color-scheme: dark)")?.matches
			? "dark"
			: "light"
		: theme.value;

onMounted(() => {
	initTheme();
});

/*if (document) {
	document.documentElement.setAttribute("data-theme", _theme);
	document.documentElement.classList.add(`scheme-${_theme}`);

	// document.documentElement.classList.add(`density-${density.value}`);

	if (alter.value) document.documentElement.classList.add('alter');
	if (highContrast.value) document.documentElement.classList.add('high-contrast');
}*/
</script>
<template>
	<Teleport to="#__nuxt">
		<Navbar v-if="session && !isAuthRoute" />
	</Teleport>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>
