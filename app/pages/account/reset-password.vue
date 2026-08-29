<script setup lang="ts">
import { AtSymbolIcon, KeyIcon, HomeIcon } from "@heroicons/vue/24/solid";

import Box from "~/components/base/Box.vue";
import Button from "~/components/Button.vue";
import Input from "~/components/Input.vue";

const { error, login, refresh, session } = useAuthSession();

const { $api } = useNuxtApp();

const password = ref("");
const token = useRoute().query.token as string;
const passwordRegex =
	/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,}$/;

await refresh();

const handlePasswordReset = async () => {
	await $api("/account/change-password", {
		method: "POST",
		body: { newPassword: password.value, token },
	});

	// await navigateTo("/auth/login");
};

useHead({
	title: "Réinitialisation du mot de passe | Ademyst",
	meta: [
		{
			name: "description",
			content: "Réinitialisez votre mot de passe Beam.",
		},
		{
			name: "keywords",
			content: "Beam, Ademyst, Réinitialisation du mot de passe",
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
					:icon="HomeIcon"
					label="Retourner sur la page d'accueil"
					variant="link"
					size="medium"
					handler="/"
				/>
			</div>
			<Box class="w-full md:max-w-lg">
				<h1 class="text-2xl text-center font-bold">
					Réinitialisation du mot de passe
				</h1>
				<p>
					Entrez votre nouveau mot de passe pour réinitialiser votre
					compte. Cela mettra fin à toutes les sessions actives et
					vous devrez vous reconnecter avec votre nouveau mot de
					passe.
				</p>
				<form class="flex flex-col gap-6">
					<Input
						v-model="password"
						:icon="KeyIcon"
						label="Nouveau mot de passe"
						type="password"
						placeholder="mdp#123"
						:validate="passwordRegex"
						required
					>
						<template #indications>
							<p>Le mot de passe doit contenir :</p>
							<ul class="list-disc list-inside">
								<li>Au moins 8 caractères</li>
								<li>Au moins une lettre majuscule</li>
								<li>Au moins une lettre minuscule</li>
								<li>Au moins un chiffre</li>
								<li>Au moins un caractère spécial</li>
							</ul>
						</template>
						<template #error>
							Le mot de passe n'est pas assez sécurisé.
						</template>
					</Input>
					<div
						class="flex justify-start items-center gap-4 w-full"
						v-if="error"
					>
						<span class="text-danger"
							>Impossible de réinitialiser le mot de passe.</span
						>
					</div>
					<div class="flex justify-center items-center gap-4 w-full">
						<Button
							label="Changer le mot de passe"
							size="medium"
							:handler="handlePasswordReset"
						/>
					</div>
				</form>
			</Box>
			<div class="flex justify-center items-center gap-2">
				<span class="text-muted max-sm:hidden">Lien invalide ?</span>
				<Button
					label="Nouveau lien"
					variant="link"
					handler="/auth/forgot-password"
				/>
			</div>
		</div>
	</header>
</template>
