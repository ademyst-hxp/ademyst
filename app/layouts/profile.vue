<!--
	Default layout with the navbar on the top (or down if mobile) and asides
-->
<script setup lang="ts">
import Navbar from "~/components/layout/Navbar.vue";
</script>
<template>
	<div class="min-h-dvh p-4 pb-22 box-border max-w-dvw md:pb-4">
		<Navbar />

		<div
			class="layout-grid grid grid-cols-[1fr_2fr_1fr] grid-rows-[auto_1fr] gap-2 md:mt-2"
		>
			<div
				class="side-left flex flex-col justify-start gap-4 max-w-full md:sticky md:top-26 md:h-[calc(100dvh-7.5rem)]"
			>
				<header
					id="header"
					class="header flex flex-col gap-4 bg-surface text-surface-text border border-surface-border rounded-4xl min-w-0 h-fit p-6 md:p-8"
				/>

				<footer
					id="footer-in-header"
					class="footer-in-header flex flex-col gap-2 h-fit"
				>
					<ul
						class="flex justify-center flex-wrap gap-4 text-sm text-surface-text-muted text-center"
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

			<main class="main-content flex flex-col gap-4 min-w-0">
				<slot />
			</main>

			<footer id="footer" class="footer flex flex-col gap-2 h-fit">
				<ul
					class="flex justify-center flex-wrap gap-4 text-sm text-surface-text-muted text-center"
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
		"header main ."
		"header main .";
}

.side-left {
	grid-area: header;
}

.main-content {
	grid-area: main;
}

.footer {
	grid-area: footer;
	display: none;
}

@media (max-width: 1024px) {
	.layout-grid {
		grid-template-columns: 1fr 2fr;
		grid-template-areas:
			"header main"
			"header main";
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

	.footer-in-header {
		display: none;
	}

	.footer {
		display: flex;
	}
}
</style>
