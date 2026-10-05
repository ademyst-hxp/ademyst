<script setup lang="ts">
import Box from "~/components/base/Box.vue";
import Actions from "~/components/base/Actions.vue";

import BadgeInfo from "~/components/profile/BadgeInfo.vue";

import {
	UserIcon,
	ChevronRightIcon,
	ChevronLeftIcon,
	InformationCircleIcon,
	XMarkIcon,
	SparklesIcon,
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
const focusedEntitlement = ref<BadgeEntitlement | null>(null);
</script>
<template>
	<Teleport to="#header">
		<nav
			class="grid grid-cols-[auto_1fr_auto] items-center justify-center gap-4"
		>
			<Button
				label="Retour"
				variant="link"
				:icon="ChevronLeftIcon"
				:handler="() => navigateTo('/settings')"
				class="justify-self-start"
			/>
			<h1 class="justify-self-center text-2xl font-bold font-title">
				<template class="max-sm:hidden">Gérer vos badges</template>
				<template class="sm:hidden">Badges</template>
			</h1>
		</nav>
	</Teleport>

	<section class="flex flex-col gap-2">
		<Box
			:customColor="session?.profile.badge?.color"
			@click="navigateTo('/settings/badges')"
			class="items-start justify-center"
			:class="session?.profile.badge?.color ? 'text-white' : ''"
		>
			<div>
				<p>Mon niveau:</p>
				<h2 class="text-xl font-semibold font-title">
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
	</section>
	<p class="text-muted px-8">
		Les badges vous permettent de personnaliser votre profil et de montrer
		vos réalisations.
	</p>
	<section class="flex flex-col gap-2">
		<h2 class="text-xl font-semibold font-title px-8">Mes badges</h2>
		<p
			v-if="!entitlements || entitlements.length === 0"
			class="text-muted px-8"
		>
			Vous n'avez pas encore de badges. Obtenez-en en accomplissant des
			actions sur la plateforme !
		</p>
		<div
			class="flex flex-col gap-2"
			v-if="levelBadges && levelBadges.length > 0"
		>
			<h3 class="text-lg font-semibold font-title px-8">Badges de grade</h3>
			<Actions
				scale="sm"
				:actions="
					levelBadges.map((entitlement) => ({
						label: entitlement.badge.name,
						icon: `/api/v1/badges/${entitlement.badge.id}/icon.png`,
						indicator: entitlement.enabled ? 'Porté' : 'Masqué',
						handler: () => {
							focusedEntitlement = entitlement;
						},
					}))
				"
			/>
		</div>
		<div
			class="flex flex-col gap-2"
			v-if="certificationBadges && certificationBadges.length > 0"
		>
			<h3 class="text-lg font-semibold font-title px-8">Certifications</h3>
			<Actions
				scale="sm"
				:actions="
					certificationBadges.map((entitlement) => ({
						label: entitlement.badge.name,
						icon: `/api/v1/badges/${entitlement.badge.id}/icon.png`,
						indicator: entitlement.enabled ? 'Porté' : 'Masqué',
						handler: () => {
							focusedEntitlement = entitlement;
						},
					}))
				"
			/>
		</div>
		<div
			class="flex flex-col gap-2"
			v-if="otherBadges && otherBadges.length > 0"
		>
			<h3
				class="text-lg font-semibold font-title px-8"
				v-if="
					(levelBadges && levelBadges.length > 0) ||
					(certificationBadges && certificationBadges.length > 0)
				"
			>
				Autres badges
			</h3>
			<Actions
				scale="sm"
				:actions="
					otherBadges.map((entitlement) => ({
						label: entitlement.badge.name,
						icon: `/api/v1/badges/${entitlement.badge.id}/icon.png`,
						indicator: entitlement.enabled ? 'Porté' : 'Masqué',
						handler: () => {
							focusedEntitlement = entitlement;
						},
					}))
				"
			/>
		</div>
	</section>
	<section class="flex flex-col gap-2">
		<h2 class="text-xl font-semibold font-title px-8">Vous cherchiez peut-être...</h2>
		<Actions
			scale="sm"
			layout="horizontal"
			:actions="[
				{
					label: 'Profil',
					icon: UserIcon,
					handler: '/settings/profile',
				},
			]"
		/>
	</section>

	<BadgeInfo
		v-if="focusedBadge"
		:badge="focusedBadge"
		@close="focusedBadge = null"
	/>

	<Menu
		v-if="focusedEntitlement"
		:title="focusedEntitlement.badge.name"
		:actions="[
			{
				label: 'Voir les détails',
				icon: InformationCircleIcon,
				handler: () => {
					focusedBadge = focusedEntitlement!.badge;
					focusedEntitlement = null;
				},
			},
			{
				label: focusedEntitlement.enabled ? 'Masquer' : 'Porter',
				icon: focusedEntitlement.enabled ? XMarkIcon : SparklesIcon,
				handler: () => {
					if (focusedEntitlement!.enabled) {
						disableEntitlement(focusedEntitlement!);
					} else {
						enableEntitlement(focusedEntitlement!);
					}
					focusedEntitlement = null;
				},
			},
		]"
		@close="focusedEntitlement = null"
	/>
</template>
