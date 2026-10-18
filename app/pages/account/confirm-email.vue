<script setup lang="ts">
import { AtSymbolIcon, HomeIcon } from "@heroicons/vue/24/solid";

import Box from "~/components/base/Box.vue";
import Card from "~/components/base/Card.vue";
import Button from "~/components/Button.vue";

const { refresh, session } = useAuthSession();

const { $api } = useNuxtApp();

const token = useRoute().query.token as string;

await refresh();

const errorMessage = ref<string | null>(null);

type ConfirmEmailResponse = {
	ok: boolean;
	email: string | null;
};

const { data: confirmEmailResponse } = await useAsyncData<ConfirmEmailResponse>(
	"confirm-email",
	async () => {
		if (!token) {
			errorMessage.value = "Le token de confirmation est manquant.";
			return { ok: false, email: null };
		}

		try {
			return await $api<ConfirmEmailResponse>("/account/confirm-email", {
				method: "POST",
				body: { token },
			});
		} catch (error: any) {
			const payload = error.data ?? error.response?._data;

			errorMessage.value =
				payload?.statusMessage ??
				payload?.message ??
				error.message ??
				"Une erreur est survenue lors de la confirmation de l'adresse e-mail.";

			return {
				ok: false,
				email: payload?.data?.email ?? null,
			};
		}
	},
);

definePageMeta({
	title: "Confirmation de l'adresse e-mail | Ademyst",
	description: "Confirmez votre adresse e-mail.",
	layout: "auth",
});

useHead({
	title: "Confirmation de l'adresse e-mail | Ademyst",
	meta: [
		{
			name: "description",
			content: "Confirmez votre adresse e-mail.",
		},
		{
			name: "keywords",
			content: "Beam, Ademyst, Confirmation de l'adresse e-mail",
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
	<div class="flex justify-center items-center w-full px-8">
		<Button
			:icon="HomeIcon"
			label="Retourner sur la page d'accueil"
			variant="link"
			size="medium"
			handler="/"
		/>
	</div>
	<Box v-if="confirmEmailResponse?.ok" class="w-full md:max-w-lg">
		<AtSymbolIcon class="w-12 h-12 text-primary mx-auto md:w-16 md:h-16" />
		<h1 class="text-2xl text-center font-bold font-title">
			Votre adresse est confirmée !
		</h1>
		<Card
			v-if="confirmEmailResponse?.email"
			scale="sm"
			class="items-center justify-center"
		>
			{{ confirmEmailResponse.email }}
		</Card>
		<p class="text-center text-surface-text-muted">
			Vous pouvez maintenant vous connecter à votre compte Ademyst et
			continuer votre aventure.
		</p>
		<div class="flex justify-center items-center gap-2">
			<Button
				v-if="!session"
				label="Se connecter"
				variant="primary"
				handler="/auth/login"
			/>
			<Button
				v-else
				label="Aller à l'accueil"
				variant="primary"
				handler="/"
			/>
		</div>
	</Box>
	<Box v-else class="w-full md:max-w-lg">
		<h1 class="text-2xl text-center font-bold font-title">
			Votre adresse n'a pas pu être confirmé
		</h1>
		<Card
			v-if="confirmEmailResponse?.email"
			scale="sm"
			class="items-center justify-center"
		>
			{{ confirmEmailResponse.email }}
		</Card>
		<p class="text-center text-surface-text-muted">
			<template v-if="errorMessage?.includes('Invalid token')">
				Le lien de confirmation est invalide. Veuillez en demander un
				nouveau dans vos
				<Button
					label="paramètres de compte"
					variant="link"
					handler="/settings/account"
					class="inline"
				/>
			</template>
			<template v-else-if="errorMessage?.includes('Token revoked')">
				Le lien de confirmation a été révoqué. Veuillez en demander un
				nouveau dans vos
				<Button
					label="paramètres de compte"
					variant="link"
					handler="/settings/account"
					class="inline"
				/>
			</template>
			<template v-else-if="errorMessage?.includes('Token already used')">
				Le lien de confirmation a déjà été utilisé. Veuillez en demander
				un nouveau dans vos
				<Button
					label="paramètres de compte"
					variant="link"
					handler="/settings/account"
					class="inline"
				/>
			</template>
			<template v-else>
				Une erreur est survenue lors de la confirmation de votre adresse
				e-mail. Veuillez réessayer plus tard.
			</template>
		</p>
		<div class="flex justify-center items-center gap-2">
			<Button
				v-if="!session"
				label="Se connecter"
				variant="primary"
				handler="/auth/login"
			/>
			<Button
				v-else
				label="Aller à l'accueil"
				variant="primary"
				handler="/"
			/>
		</div>
	</Box>
</template>
