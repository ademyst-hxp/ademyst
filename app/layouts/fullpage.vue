<!--
	Default layout with the navbar on the top (or nowhere if mobile) and asides
-->
<script setup lang="ts">
import Navbar from "~/components/layout/Navbar.vue";
</script>
<template>
	<div class="min-h-dvh p-4 box-border max-w-dvw">
		<Navbar class="max-md:hidden" />

		<div
			class="layout-grid grid grid-cols-[1fr_2fr_1fr] grid-rows-[auto_auto_1fr] gap-2"
		>
			<aside
				id="side-left"
				class="left-sidebar sticky top-26 h-[calc(100dvh-0.5rem)] max-w-full md:h-[calc(100dvh-7.5rem)]"
			/>

			<header
				id="header"
				class="header flex flex-col gap-2 min-w-0 max-w-full h-fit"
			/>

			<main class="main-content flex flex-col gap-2 min-w-0 max-w-full">
				<slot />
			</main>

			<aside
				id="side-right"
				class="right-sidebar sticky top-26 h-[calc(100dvh-0.5rem)] max-w-full md:h-[calc(100dvh-7.5rem)]"
			/>

			<footer id="footer" class="footer flex flex-col gap-2 max-w-full h-fit">
				<ul
					class="flex flex-wrap justify-center gap-4 text-sm text-surface-text-muted text-center"
				>
					<li>
						<RouterLink
							to="/legal/terms"
							class="font-semibold hover:text-primary hover:underline"
						>
							CGU
						</RouterLink>
					</li>
					<li>
						<RouterLink
							to="/press"
							class="font-semibold hover:text-primary hover:underline"
						>
							Presse
						</RouterLink>
					</li>
					<li>
						<RouterLink
							to="/help"
							class="font-semibold hover:text-primary hover:underline"
						>
							Aide
						</RouterLink>
					</li>
					<li>
						<RouterLink
							to="/settings/appearance"
							class="font-semibold hover:text-primary hover:underline"
						>
							Accessibilité
						</RouterLink>
					</li>
					<li>
						<RouterLink
							to="/legal/privacy"
							class="font-semibold hover:text-primary hover:underline"
						>
							Confidentialité
						</RouterLink>
					</li>
				</ul>
				<p class="text-sm text-surface-text-muted text-center">
					&copy; 2026 Ademyst. Tous droits réservés.
				</p>
			</footer>
		</div>
	</div>
</template>
<style scoped>
.layout-grid {
	grid-template-areas:
		"left header right"
		"left main right"
		"left footer right";
}

.header {
	grid-area: header;
}

.left-sidebar {
	grid-area: left;
}

.main-content {
	grid-area: main;
}

.right-sidebar {
	grid-area: right;
}

.footer {
	grid-area: footer;
}

@media (max-width: 1024px) {
	.layout-grid {
		grid-template-columns: 2fr 1fr;
		grid-template-areas:
			"header right"
			"main right"
			"footer right";
	}

	.left-sidebar {
		display: none;
	}
}

@media (max-width: 768px) {
	.layout-grid {
		grid-template-columns: 1fr;
		grid-template-areas:
			"header"
			"main"
			"footer";
	}

	.right-sidebar {
		display: none;
	}
}
</style>
