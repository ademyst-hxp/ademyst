<script setup lang="ts">
import { AtSymbolIcon, KeyIcon, HomeIcon } from "@heroicons/vue/24/solid";

import Box from "~/components/base/Box.vue";
import Button from "~/components/Button.vue";
import Input from "~/components/Input.vue";

const { error, login, refresh, session } = useAuthSession();

const email = ref("");
const password = ref("");

await refresh();

const handleLogin = async () => {
	await login(email.value, password.value);

	if (session.value) {
		await navigateTo("/discover");
	}
};

useHead({
	title: "Connexion | Ademyst",
	meta: [
		{
			name: "description",
			content: "Connectez-vous à votre compte Beam.",
		},
		{
			name: "keywords",
			content: "Beam, Ademyst, Connexion",
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
		>
			<div
				class="flex items-center bg-black/50 backdrop-blur-lg rounded-3xl overflow-hidden max-md:hidden"
			>
				<img
					src="https://u.cubeupload.com/The_seven_remix/nOB5Rj.jpg"
					class="h-48"
				/>
				<div class="p-8">
					<h2 class="text-3xl font-bold italic">
						« Merde, j'ai cassé Beam »
					</h2>
					<p>~ Loan, une quinzaine de fois en 2026</p>
				</div>
			</div>
		</div>
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
					Heureux de vous revoir !
				</h1>
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
					<Input
						v-model="password"
						:icon="KeyIcon"
						label="Mot de passe"
						type="password"
						placeholder="mdp#123"
						required
					/>
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
					<div class="flex justify-end items-center gap-4 w-full">
						<Button
							label="Mot de passe oublié ?"
							variant="link"
							handler="/auth/forgot-password"
						/>
					</div>
					<div class="flex justify-center items-center gap-4 w-full">
						<Button
							label="Se connecter"
							size="medium"
							:handler="handleLogin"
						/>
					</div>
				</form>
			</Box>
			<div class="flex justify-center items-center gap-2">
				<span class="text-muted max-sm:hidden">Pas de compte ?</span>
				<Button
					label="S'inscrire"
					variant="link"
					handler="/auth/signup"
				/>
			</div>
		</div>
	</header>
</template>
