<script setup lang="ts">
import { AtSymbolIcon, ChevronLeftIcon } from "@heroicons/vue/24/solid";

import Box from "~/components/base/Box.vue";
import Button from "~/components/Button.vue";
import Input from "~/components/Input.vue";

const { error, refresh } = useAuthSession();

const { $api } = useNuxtApp();

const email = ref("");

await refresh();

const handleEmailSend = async () => {
	await $api("/auth/reset-password", {
		method: "POST",
		body: { email: email.value },
	});

	await navigateTo("/auth/login");
};

definePageMeta({
	title: "Mot de passe oublié | Ademyst",
	description: "Réinitialisez votre mot de passe Beam.",
	layout: "auth",
});

useHead({
	title: "Mot de passe oublié | Ademyst",
	meta: [
		{
			name: "description",
			content: "Réinitialisez votre mot de passe Beam.",
		},
		{
			name: "keywords",
			content: "Beam, Ademyst, Mot de passe oublié",
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
			label="Retourner sur la page de connexion"
			variant="link"
			size="medium"
			handler="/auth/login"
		/>
	</div>
	<Box class="w-full md:max-w-lg">
		<h1 class="text-2xl text-center font-bold font-title">Mot de passe oublié ?</h1>
		<p>
			Entrez votre adresse e-mail et nous vous enverrons un lien pour
			réinitialiser votre mot de passe.
		</p>
		<form class="flex flex-col gap-6" @submit.prevent="handleEmailSend">
			<Input
				v-model="email"
				:icon="AtSymbolIcon"
				label="Adresse mail"
				type="email"
				:validate="/\S+@\S+\.\S+/"
				placeholder="mail@example.com"
				required
			>
				<template #error>
					Veuillez entrer une adresse email valide.
				</template>
			</Input>
			<div
				class="flex justify-start items-center gap-4 w-full"
				v-if="error"
			>
				<span class="text-danger" v-if="error && error.includes('401')"
					>Nom d'utilisateur ou mot de passe incorrect.</span
				>
				<span class="text-danger" v-else
					>Impossible de se connecter.</span
				>
			</div>
			<div class="flex justify-center items-center gap-2 w-full">
				<Button
					label="Retour"
					:icon="ChevronLeftIcon"
					size="medium"
					variant="link"
					:handler="$router.back"
				/>
				<Button
					label="Envoyer l'email"
					size="medium"
					submit
				/>
			</div>
		</form>
	</Box>
</template>
