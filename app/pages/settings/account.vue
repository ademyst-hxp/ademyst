<script setup lang="ts">
import { type Account } from "~~/shared/models/accounts";

import { AtSymbolIcon, ChevronLeftIcon, EyeSlashIcon, UserIcon } from "@heroicons/vue/24/outline";

import Actions from "~/components/base/Actions.vue";
import Box from "~/components/base/Box.vue";

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
	data: Account;
};

const { data: account, refresh: refreshSettings } = await useAsyncData(
	"settings-account",
	async () => {
		return (await $api<AccountResponse>(`/account`)).data;
	},
);

const confirmationError = ref<string | null>(null);
const confirmationSent = ref(false);

type ApiError = {
	data?: { statusMessage?: string; message?: string };
	response?: { _data?: { statusMessage?: string; message?: string } };
	message?: string;
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
	const requestError = error as ApiError;
	const responseData = requestError.data ?? requestError.response?._data;

	return (
		responseData?.statusMessage ??
		responseData?.message ??
		requestError.message ??
		fallback
	);
};

const askEmailConfirmation = async () => {
	if (!account.value?.email) {
		confirmationError.value =
			"Impossible d'envoyer l'e-mail de confirmation. Aucune adresse e-mail trouvée.";
		return false;
	}

	confirmationError.value = null;

	try {
		await $api("/auth/ask-email-confirmation", {
			method: "POST",
			body: { email: account.value.email },
		});

		confirmationSent.value = true;
		return true;
	} catch (error) {
		confirmationSent.value = false;
		confirmationError.value = getApiErrorMessage(
			error,
			"Impossible d'envoyer l'e-mail de confirmation.",
		);

		console.error("Failed to ask for email confirmation:", error);
		return false;
	}
};

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
			<h1 class="justify-self-center text-2xl font-bold font-title">
				Compte & Accès
			</h1>
		</nav>
	</Teleport>

	<section class="flex flex-col gap-4">
		<h2 class="text-xl font-semibold font-title">Infos de connexion</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
			<Box class="flex-0 -space-y-1 md:col-span-2" scale="sm">
				<span class="text-2xl font-bold">{{ account?.email }}</span>
				<span class="text-muted"
					>Adresse e-mail
					<template v-if="!account?.confirmedAt"
						>(non confirmée)</template
					></span
				>
			</Box>
			<Box class="flex-0 -space-y-1" scale="sm">
				<p class="text-2xl font-bold">
					{{
						new Date(account?.createdAt || 0).toLocaleDateString(
							"fr-FR",
							{
								day: "2-digit",
								month: "short",
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
						new Date(account?.updatedAt || 0).toLocaleDateString(
							"fr-FR",
							{
								day: "2-digit",
								month: "short",
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
	<section class="flex flex-col gap-4" v-if="!account?.confirmedAt">
		<Box class="justify-center items-center">
			<AtSymbolIcon
				class="w-12 h-12 text-warning mx-auto md:w-16 md:h-16"
			/>
			<h2 class="text-xl font-semibold font-title text-center">
				Votre adresse e-mail n'est pas confirmée
			</h2>
			<p class="text-muted text-center">
				Vous devez confirmer votre adresse e-mail pour accéder à toutes
				les fonctionnalités d'Ademyst.<br />
				Veuillez vérifier votre boîte de réception pour le lien de
				confirmation.
			</p>
			<p v-if="confirmationSent" class="text-success text-center">
				Un e-mail de confirmation a été envoyé à {{ account?.email }}.
				Veuillez vérifier votre boîte de réception.
			</p>
			<p v-if="confirmationError" class="text-danger text-center">
				L'envoi de l'e-mail de confirmation a échoué, veuillez
				réessayer.
			</p>
			<div class="flex gap-2">
				<Button
					label="Renvoyer le lien de confirmation"
					variant="primary"
					:handler="askEmailConfirmation"
				/>
			</div>
		</Box>
	</section>
	<section class="flex flex-col gap-4">
		<h2 class="text-xl font-semibold font-title">
			Vous cherchiez peut-être...
		</h2>
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
