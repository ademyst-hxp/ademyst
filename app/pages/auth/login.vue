<script setup lang="ts">
import { AtSymbolIcon, KeyIcon, HomeIcon } from "@heroicons/vue/24/solid";

import Box from "~/components/base/Box.vue";
import Button from "~/components/Button.vue";
import Input from "~/components/Input.vue";

import Avatar from "~/components/profile/Avatar.vue";

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

definePageMeta({
	title: "Connexion | Ademyst",
	description: "Connectez-vous à votre compte Beam.",
	layout: "auth",
});

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
		<h1 class="text-2xl text-center font-bold">Heureux de vous revoir !</h1>
		<p v-if="session" class="text-center text-success">
			Connecté en tant que
			<span class="flex items-center gap-1">
				<Avatar
					:src="`/api/v1/users/${session.profile.name}/avatar.webp`"
					size="sm"
				/>
				{{ session.profile.name }}
			</span>.
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
				<span class="text-danger" v-if="error && error.includes('401')"
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
		<Button label="S'inscrire" variant="link" handler="/auth/signup" />
	</div>
</template>
