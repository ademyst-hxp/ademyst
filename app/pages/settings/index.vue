<script setup lang="ts">
import Box from "~/components/base/Box.vue";
import Menu from "~/components/Menu.vue";

import {
	UserIcon,
	CheckBadgeIcon,
	GlobeAltIcon,
	KeyIcon,
	ShieldCheckIcon,
	BellSnoozeIcon,
	EyeIcon,
	ShareIcon,
	ChevronRightIcon,
	LightBulbIcon,
} from "@heroicons/vue/24/outline";

const { session, refresh } = useAuthSession();
await refresh();

if (!session.value) {
	navigateTo("/auth/login");
}

definePageMeta({
	title: "Paramètres | Ademyst",
	description: "Modifiez vos paramètres de compte et d'affichage.",
	middleware: ["auth"],
});

useHead({
	title: "Paramètres | Ademyst",
	meta: [
		{
			name: "description",
			content: "Modifiez vos paramètres de compte et d'affichage.",
		},
		{
			name: "keywords",
			content: "Beam, Ademyst, Paramètres",
		},
		{
			name: "author",
			content: "Ejnalo",
		},
		{
			name: "viewport",
			content: "width=device-width, initial-scale=1.0",
		},
	],
});
</script>
<template>
	<div class="md:flex">
		<aside class="basis-1/4 max-xl:hidden">
			<!-- Vide -->
		</aside>
		<section
			class="basis-2/3 flex flex-col gap-4 overflow-y-auto p-4 max-md:order-0 md:p-8 xl:basis-2/4"
		>
			<header class="flex flex-col gap-4">
				<h1 class="text-2xl font-bold px-8">Paramètres</h1>
			</header>
			<main class="flex flex-col gap-8 overflow-visible">
				<section class="flex flex-col gap-4">
					<div class="flex gap-2 max-md:flex-col">
						<Box
							scale="sm"
							layout="horizontal"
							class="items-center w-full cursor-pointer hover:scale-101 duration-200 transition-transform"
							@click="navigateTo('/settings/profile')"
						>
							<div class="flex items-center gap-2 w-full">
								<UserIcon class="h-8 w-8" />
								<p class="grow text-lg font-medium">Profil</p>
								<LightBulbIcon
									class="h-5 w-5 text-yellow-400"
								/>
								<ChevronRightIcon
									class="text-surface-text-muted h-5 w-5"
								/>
							</div>
						</Box>
						<Box
							scale="sm"
							layout="horizontal"
							class="items-center w-full cursor-pointer hover:scale-101 duration-200 transition-transform"
							@click="navigateTo('/settings/appearance')"
						>
							<div class="flex items-center gap-2 w-full">
								<GlobeAltIcon class="h-8 w-8" />
								<p class="grow text-lg font-medium">
									Accessibilité
								</p>
								<LightBulbIcon
									class="h-5 w-5 text-yellow-400"
								/>
								<ChevronRightIcon
									class="text-surface-text-muted h-5 w-5"
								/>
							</div>
						</Box>
					</div>
				</section>
				<section class="flex flex-col gap-4">
					<h2 class="text-xl font-semibold px-8">Compte et profil</h2>
					<div class="flex flex-col gap-2">
						<Box
							scale="sm"
							layout="horizontal"
							class="items-center w-full cursor-pointer hover:scale-101 duration-200 transition-transform"
							@click="navigateTo('/settings/profile')"
						>
							<div class="flex items-center gap-2 w-full">
								<UserIcon class="h-8 w-8" />
								<p class="grow text-lg font-medium">Profil</p>
								<ChevronRightIcon
									class="text-surface-text-muted h-5 w-5"
								/>
							</div>
						</Box>
						<Box
							v-if="(session?.profile.level ?? 0) >= 4"
							scale="sm"
							layout="horizontal"
							class="items-center w-full cursor-pointer hover:scale-101 duration-200 transition-transform"
							:customColor="session?.profile.badge?.color"
							:class="
								session?.profile.badge?.color
									? 'text-white'
									: ''
							"
							@click="navigateTo('/settings/badges')"
						>
							<div class="flex items-center gap-2 w-full">
								<CheckBadgeIcon class="h-8 w-8" />
								<p class="grow text-lg font-medium">
									Certifications et badges
								</p>
								<ChevronRightIcon
									class="h-5 w-5"
									:class="
										session?.profile.badge?.color
											? ''
											: 'text-surface-text-muted'
									"
								/>
							</div>
						</Box>
						<Box
							scale="sm"
							layout="horizontal"
							class="items-center w-full cursor-pointer hover:scale-101 duration-200 transition-transform"
							@click="navigateTo('/settings/account')"
						>
							<div class="flex items-center gap-2 w-full">
								<KeyIcon class="h-8 w-8" />
								<p class="grow text-lg font-medium">
									Compte et accès
								</p>
								<ChevronRightIcon
									class="text-surface-text-muted h-5 w-5"
								/>
							</div>
						</Box>
					</div>
				</section>
				<section class="flex flex-col gap-4">
					<h2 class="text-xl font-semibold px-8">Préférences</h2>
					<div class="flex flex-col gap-2">
						<Box
							scale="sm"
							layout="horizontal"
							class="items-center w-full cursor-pointer hover:scale-101 duration-200 transition-transform"
							@click="navigateTo('/settings/appearance')"
						>
							<div class="flex items-center gap-2 w-full">
								<EyeIcon class="h-8 w-8" />
								<p class="grow text-lg font-medium">
									Apparence et accessibilité
								</p>
								<ChevronRightIcon
									class="text-surface-text-muted h-5 w-5"
								/>
							</div>
						</Box>
						<Box
							scale="sm"
							layout="horizontal"
							class="items-center w-full cursor-pointer hover:scale-101 duration-200 transition-transform"
							@click="navigateTo('/settings/privacy')"
						>
							<div class="flex items-center gap-2 w-full">
								<ShieldCheckIcon class="h-8 w-8" />
								<p class="grow text-lg font-medium">
									Confidentialité
								</p>
								<ChevronRightIcon
									class="text-surface-text-muted h-5 w-5"
								/>
							</div>
						</Box>
						<Box
							scale="sm"
							layout="horizontal"
							class="items-center w-full cursor-pointer hover:scale-101 duration-200 transition-transform"
							@click="navigateTo('/settings/mailing')"
						>
							<div class="flex items-center gap-2 w-full">
								<BellSnoozeIcon class="h-8 w-8" />
								<p class="grow text-lg font-medium">
									Notifications et mails
								</p>
								<ChevronRightIcon
									class="text-surface-text-muted h-5 w-5"
								/>
							</div>
						</Box>
					</div>
				</section>
				<section class="flex flex-col gap-4">
					<h2 class="text-xl font-semibold px-8">Autres</h2>
					<div class="flex flex-col gap-2">
						<Box
							scale="sm"
							layout="horizontal"
							class="items-center w-full cursor-pointer hover:scale-101 duration-200 transition-transform"
							@click="navigateTo('/settings/appearance')"
						>
							<div class="flex items-center gap-2 w-full">
								<ShareIcon class="h-8 w-8" />
								<p class="grow text-lg font-medium">
									Inviter tes amis
								</p>
								<ChevronRightIcon
									class="text-surface-text-muted h-5 w-5"
								/>
							</div>
						</Box>
					</div>
				</section>
			</main>
			<footer class="flex flex-col gap-4">
				<p class="text-sm text-surface-text/50 px-8">
					<RouterLink
						to="/legal/terms"
						class="font-semibold hover:text-primary hover:underline"
						>CGU</RouterLink
					>
					|
					<RouterLink
						to="/legal/privacy"
						class="font-semibold hover:text-primary hover:underline"
						>Politique de confidentialité</RouterLink
					>
				</p>
			</footer>
		</section>
		<aside
			class="basis-1/4 sticky top-24 flex flex-col gap-4 overflow-y-auto p-4 max-md:order-0 md:p-8 max-xl:hidden"
		></aside>
	</div>
</template>
