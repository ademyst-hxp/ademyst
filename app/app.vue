<script setup lang="ts">
const { initTheme } = useTheme();
const route = useRoute();

onMounted(() => {
	initTheme();
});

watch(
	() => route.fullPath,
	() => initTheme(),
);
</script>
<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>
