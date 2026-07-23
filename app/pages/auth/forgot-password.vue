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
</script>
<template>
	<header
		class="_no_container flex flex-row-reverse h-screen max-md:flex-col"
	>
		<div
			class="flex flex-col items-stretch justify-center gap-8 bg-[url('/images/splash_1.png')] bg-cover bg-center text-white max-md:h-48 md:w-1/2 md:p-16"
		></div>
		<div
			class="flex flex-col justify-center items-center gap-2 p-6 md:w-1/2 mx:p-8 md:mx-auto"
		>
			<div class="flex justify-center items-center w-full px-8">
				<Button
					label="Retourner sur la page de connexion"
					variant="link"
					size="medium"
					handler="/auth/login"
				/>
			</div>
			<Box class="w-full md:max-w-lg">
				<h1 class="text-2xl text-center font-bold">
					Mot de passe oublié ?
				</h1>
				<p>
					Entrez votre adresse e-mail et nous vous enverrons un lien pour
					réinitialiser votre mot de passe.
				</p>
				<form class="flex flex-col gap-6">
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
						<span
							class="text-danger"
							v-if="error && error.includes('401')"
							>Nom d'utilisateur ou mot de passe incorrect.</span
						>
						<span class="text-danger" v-else
							>Impossible de se connecter.</span
						>
					</div>
					<div class="flex justify-center items-center gap-2 w-full">
						<Button
							label="Retour"
							:icon=ChevronLeftIcon
							size="medium"
							variant="tertiary"
							:handler="$router.back"
						/>
						<Button
							label="Envoyer l'email"
							size="medium"
							:handler="handleEmailSend"
						/>
					</div>
				</form>
			</Box>
		</div>
	</header>
</template>
