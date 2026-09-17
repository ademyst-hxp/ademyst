<script setup lang="ts">
import Box from "~/components/base/Box.vue";
import Actions from "~/components/base/Actions.vue";

import {
	UserIcon,
	EyeSlashIcon,
	ChevronLeftIcon,
} from "@heroicons/vue/24/outline";

import { type Account } from "~~/shared/models/accounts";

const { session, refresh: refreshSession } = useAuthSession();
await refreshSession();

const { $api } = useNuxtApp();

if (!session.value) {
	navigateTo("/auth/login");
}

const refresh = async () => {
	Promise.all([await refreshSession(), await refreshSettings()]);
};

definePageMeta({
	title: "Compte & Accès | Ademyst",
	description: "Modifiez vos paramètres de compte et d'affichage.",
	middleware: ["auth"],
});

useHead({
	title: "Compte & Accès | Ademyst",
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

type AccountResponse = {
	status: "ok";
	account: Account;
};

const { data: account, refresh: refreshSettings } = await useAsyncData(
	"settings-account",
	async () => {
		return (await $api<AccountResponse>(`/account`)).account;
	},
);

onMounted(async () => {
	await refreshSettings();
});
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
			<h1 class="justify-self-center text-2xl font-bold">
				Compte & Accès
			</h1>
		</nav>
	</Teleport>

	<section class="flex flex-col gap-4">
		<h2 class="text-xl font-semibold">Infos de connexion</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
			<Box class="flex-0 -space-y-1 md:col-span-2" scale="sm">
				<span class="text-2xl font-bold">{{ account?.email }}</span>
				<span class="text-muted">Adresse e-mail</span>
			</Box>
			<Box class="flex-0 -space-y-1" scale="sm">
				<p class="text-2xl font-bold">
					{{
						new Date(account?.createdAt || "").toLocaleDateString(
							"fr-FR",
							{
								day: "2-digit",
								month: "2-digit",
								year: "numeric",
							},
						)
					}}
				</p>
				<span class="text-muted">Date de création</span>
			</Box>
			<Box class="flex-0 -space-y-1" scale="sm">
				<p class="text-2xl font-bold">
					{{
						new Date(account?.updatedAt || "").toLocaleDateString(
							"fr-FR",
							{
								day: "2-digit",
								month: "2-digit",
								year: "numeric",
							},
						)
					}}
				</p>
				<span class="text-muted">Dernière modification</span>
			</Box>
		</div>
		<div class="flex flex-wrap items-center gap-4">
			<Button
				label="Modifier votre mot de passe"
				variant="link"
				:handler="() => navigateTo('/auth/sudo?action=change-password')"
			/>
			<Button
				label="Modifier votre adresse e-mail"
				variant="link"
				:handler="() => navigateTo('/auth/sudo?action=change-email')"
			/>
			<Button
				label="Supprimer votre compte"
				variant="danger"
				:handler="() => navigateTo('/auth/sudo?action=delete-account')"
			/>
		</div>
	</section>
	<section class="flex flex-col gap-4">
		<h2 class="text-xl font-semibold">Historique de sécurité</h2>
		<p class="text-muted text-center">Cette section arrive très bientôt.</p>
	</section>
	<section class="flex flex-col gap-4">
		<h2 class="text-xl font-semibold">Vous cherchiez peut-être...</h2>
		<div class="flex flex-col gap-2">
			<Actions
				scale="sm"
				:actions="[
					{
						label: 'Profil',
						icon: UserIcon,
						handler: '/settings/profile',
					},
					{
						label: 'Confidentialité',
						icon: EyeSlashIcon,
						handler: '/settings/privacy',
					},
				]"
			/>
		</div>
	</section>
</template>
