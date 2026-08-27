<script setup lang="ts">
import Box from "~/components/base/Box.vue";

import BadgeInfo from "~/components/profile/BadgeInfo.vue";

import {
	UserIcon,
	ChevronRightIcon,
} from "@heroicons/vue/24/outline";

import type { BadgeEntitlement } from "~~/shared/models/entitlements";
import type { Badge } from "~~/shared/models/shop";

const { session, refresh: refreshSession } = useAuthSession();
await refreshSession();

const { $api } = useNuxtApp();

if (!session.value) {
	navigateTo("/auth/login");
}

const refresh = async () => {
	Promise.all([await refreshSession(), await refreshEntitlements()]);
};

definePageMeta({
	title: "Gérer vos badges | Ademyst",
	description: "Modifiez vos paramètres de compte et d'affichage.",
	middleware: ["auth"],
});

useHead({
	title: "Gérer vos badges | Ademyst",
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

type EntitlementResponse = {
	status: "ok";
	entitlements: BadgeEntitlement[];
};

const { data: entitlements, refresh: refreshEntitlements } = await useAsyncData(
	"entitlements",
	async () => {
		return $api<EntitlementResponse>(`/account/entitlements/badges`).then(
			(res) => res.entitlements,
		);
	},
);

const levelBadges = computed(() =>
	entitlements.value?.filter((e) => e.badge.family?.id === "level"),
);

const certificationBadges = computed(() =>
	entitlements.value?.filter((e) => e.badge.family?.id === "certifications"),
);

const otherBadges = computed(() =>
	entitlements.value?.filter(
		(e) =>
			!e.badge.family ||
			!["level", "certifications"].includes(e.badge.family.id),
	),
);

const enableEntitlement = async (entitlement: BadgeEntitlement) => {
	if (!session.value) return;

	try {
		const response = await $fetch(
			`/api/v1/account/entitlements/badges/${entitlement.id}/enable`,
			{
				method: "POST",
			},
		);

		if (response) {
			await refresh();
			entitlement.enabled = true;
			alert("Badge activé avec succès !");
		}
	} catch (error) {
		console.error("Erreur lors de l'activation du badge :", error);
		alert("Une erreur est survenue lors de l'activation du badge.");
	}
};

const disableEntitlement = async (entitlement: BadgeEntitlement) => {
	if (!session.value) return;

	try {
		const response = await $fetch(
			`/api/v1/account/entitlements/badges/${entitlement.id}/disable`,
			{
				method: "POST",
			},
		);

		if (response) {
			await refresh();
			entitlement.enabled = false;
			alert("Badge désactivé avec succès !");
		}
	} catch (error) {
		console.error("Erreur lors de la désactivation du badge :", error);
		alert("Une erreur est survenue lors de la désactivation du badge.");
	}
};

const focusedBadge = ref<Badge | null>(null);
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
				<h1 class="text-2xl font-bold px-8">Gérer vos badges</h1>
				<Box
					:customColor="session?.profile.badge?.color"
					@click="navigateTo('/settings/badges')"
					class="items-start justify-center"
					:class="session?.profile.badge?.color ? 'text-white' : ''"
				>
					<div>
						<p>Mon niveau:</p>
						<h2 class="text-xl font-semibold">
							<template v-if="session?.profile.level === 0"
								>Banni</template
							>
							<template v-else-if="session?.profile.level === 1"
								>En sourdine</template
							>
							<template v-else-if="session?.profile.level === 2"
								>Restreint</template
							>
							<template v-else-if="session?.profile.level === 3"
								>Membre</template
							>
							<template v-else-if="session?.profile.level === 4"
								>Premium</template
							>
							<template v-else-if="session?.profile.level === 5"
								>Certifié</template
							>
							<template v-else-if="session?.profile.level === 6"
								>Aide à la modération</template
							>
							<template v-else-if="session?.profile.level === 7"
								>Modérateur</template
							>
							<template v-else-if="session?.profile.level === 8"
								>Équipe Ademyst</template
							>
							<template v-else-if="session?.profile.level === 9"
								>Fondateur</template
							>
						</h2>
					</div>
				</Box>
			</header>
			<main class="flex flex-col gap-8 overflow-visible">
				<p class="text-muted px-8">
					Les badges vous permettent de personnaliser votre profil et
					de montrer vos réalisations.
				</p>
				<section class="flex flex-col gap-4">
					<h2 class="text-xl font-semibold px-8">Mes badges</h2>
					<p
						v-if="!entitlements || entitlements.length === 0"
						class="text-muted px-8"
					>
						Vous n'avez pas encore de badges. Obtenez-en en
						accomplissant des actions sur la plateforme !
					</p>
					<div
						class="flex flex-col gap-2"
						v-if="levelBadges && levelBadges.length > 0"
					>
						<h3 class="text-lg font-semibold px-8">
							Badges de grade
						</h3>
						<Box
							v-for="entitlement in levelBadges"
							:key="entitlement.id"
							scale="sm"
							layout="horizontal"
						>
							<div class="flex items-center gap-2 grow">
								<img
									:src="`/api/v1/badges/${entitlement.badge.id}/icon.png`"
									:alt="entitlement.badge.name"
									class="cursor-pointer h-8 w-8"
									@click="focusedBadge = entitlement.badge"
								/>
								<p class="font-medium">
									{{ entitlement.badge.name }}
								</p>
							</div>
							<Button
								v-if="!entitlement.enabled"
								label="Activer"
								size="small"
								variant="success"
								:handler="() => enableEntitlement(entitlement)"
							/>
							<Button
								v-else
								label="Désactiver"
								size="small"
								variant="secondary"
								:handler="() => disableEntitlement(entitlement)"
							/>
						</Box>
					</div>
					<div
						class="flex flex-col gap-2"
						v-if="
							certificationBadges &&
							certificationBadges.length > 0
						"
					>
						<h3 class="text-lg font-semibold px-8">
							Certifications
						</h3>
						<Box
							v-for="entitlement in certificationBadges"
							:key="entitlement.id"
							scale="sm"
							layout="horizontal"
						>
							<div class="flex items-center gap-2 grow">
								<img
									:src="`/api/v1/badges/${entitlement.badge.id}/icon.png`"
									:alt="entitlement.badge.name"
									class="cursor-pointer h-8 w-8"
									@click="focusedBadge = entitlement.badge"
								/>
								<p class="font-medium">
									{{ entitlement.badge.name }}
								</p>
							</div>
							<Button
								v-if="!entitlement.enabled"
								label="Activer"
								size="small"
								variant="success"
								:handler="() => enableEntitlement(entitlement)"
							/>
							<Button
								v-else
								label="Désactiver"
								size="small"
								variant="secondary"
								:handler="() => disableEntitlement(entitlement)"
							/>
						</Box>
					</div>
					<div
						class="flex flex-col gap-2"
						v-if="otherBadges && otherBadges.length > 0"
					>
						<h3
							class="text-lg font-semibold px-8"
							v-if="
								(levelBadges && levelBadges.length > 0) ||
								(certificationBadges &&
									certificationBadges.length > 0)
							"
						>
							Autres badges
						</h3>
						<Box
							v-for="entitlement in otherBadges"
							:key="entitlement.id"
							scale="sm"
							layout="horizontal"
						>
							<div class="flex items-center gap-2 grow">
								<img
									:src="`/api/v1/badges/${entitlement.badge.id}/icon.png`"
									:alt="entitlement.badge.name"
									class="cursor-pointer h-8 w-8"
									@click="focusedBadge = entitlement.badge"
								/>
								<p class="font-medium">
									{{ entitlement.badge.name }}
								</p>
							</div>
							<Button
								v-if="!entitlement.enabled"
								label="Activer"
								size="small"
								variant="success"
								:handler="() => enableEntitlement(entitlement)"
							/>
							<Button
								v-else
								label="Désactiver"
								size="small"
								variant="secondary"
								:handler="() => disableEntitlement(entitlement)"
							/>
						</Box>
					</div>
				</section>
				<section class="flex flex-col gap-4">
					<h2 class="text-xl font-semibold px-8">
						Vous cherchiez peut-être...
					</h2>
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
								<ChevronRightIcon class="text-surface-text-muted h-5 w-5" />
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
	<BadgeInfo
		v-if="focusedBadge"
		:badge="focusedBadge"
		@close="focusedBadge = null"
	/>
</template>
