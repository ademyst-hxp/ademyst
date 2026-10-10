<script setup lang="ts">
import { AtSymbolIcon, KeyIcon, HomeIcon } from "@heroicons/vue/24/solid";

import Box from "~/components/base/Box.vue";
import Button from "~/components/Button.vue";
import Input from "~/components/Input.vue";

import Avatar from "~/components/profile/Avatar.vue";

const { error, login, refresh, session } = useAuthSession();
const { $api } = useNuxtApp();

const email = ref("");
const password = ref("");
const newEmail = ref("");

const action = useRoute().query.action as string | undefined;
const redirect = useRoute().query.redirect as string | undefined;

const actionLabels: Record<string, string> = {
	"delete-account": "Supprimer votre compte",
	"change-email": "Changer votre adresse e-mail",
	"change-password": "Changer votre mot de passe",
};

await refresh();

if (!session.value) {
	navigateTo("/auth/login");
}

const handleLogin = async () => {
	try {
		const response = await $api<{
			action: string;
			token: string;
		}>("/auth/sudo", {
			method: "POST",
			body: {
				email: email.value,
				password: password.value,
				newEmail:
					action === "change-email" ? newEmail.value : undefined,
				action: action,
			},
		});

		if (response.action === action) {
			switch (action) {
				case "delete-account":
					await navigateTo(
						(redirect || "/account/delete") +
							"?sudo=" +
							response.token,
					);
					break;
				case "change-password":
					await navigateTo(
						(redirect || "/account/reset-password") +
							"?sudo=" +
							response.token,
					);
					break;
				default:
					await navigateTo(redirect || "/settings/account");
			}
		} else {
			await navigateTo("/settings/account");
		}
	} catch (error) {
		console.error("Error during login:", error);
	}
};

definePageMeta({
	title: "Sudo | Ademyst",
	description:
		"Connectez-vous à votre compte Beam pour effectuer des opérations sensibles.",
	layout: "auth",
});

useHead({
	title: "Sudo | Ademyst",
	meta: [
		{
			name: "description",
			content:
				"Connectez-vous à votre compte Beam pour effectuer des opérations sensibles.",
		},
		{
			name: "keywords",
			content: "Beam, Ademyst, Sudo, Connexion",
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

const step = ref(0);
</script>
<template>
	<div class="flex justify-center items-center w-full px-8">
		<Button
			:icon="HomeIcon"
			label="Retourner en lieu sûr"
			variant="link"
			size="medium"
			handler="/"
		/>
	</div>
	<Box class="w-full md:max-w-lg" v-if="step == 0" @submit.prevent="handleLogin">
		<h1 class="text-2xl text-center font-bold font-title">Mode Sudo</h1>
		<p
			v-if="session"
			class="flex items-center gap-2 text-center text-success"
		>
			Connecté en tant que
			<span class="flex items-center gap-1">
				<Avatar
					:src="`/api/v1/users/${session.profile.name}/avatar.webp`"
					size="sm"
				/>
				{{ session.profile.name }} </span
			>.
		</p>
		<p>
			Action:
			<strong>{{ actionLabels[action || ""] || "Inconnue" }}</strong>
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
					v-if="action === 'change-email'"
					label="Continuer"
					size="medium"
					:handler="
						() => {
							step = 1;
						}
					"
				/>
				<Button
					v-else
					label="Confirmer"
					size="medium"
					submit
				/>
			</div>
		</form>
	</Box>
	<Box class="w-full md:max-w-lg" v-if="step == 1">
		<h1 class="text-2xl text-center font-bold font-title">Changer d'adresse e-mail</h1>
		<p
			v-if="session"
			class="flex items-center gap-2 text-center text-success"
		>
			Connecté en tant que
			<span class="flex items-center gap-1">
				<Avatar
					:src="`/api/v1/users/${session.profile.name}/avatar.webp`"
					size="sm"
				/>
				{{ session.profile.name }} </span
			>.
		</p>
		<p class="text-muted text-sm">
			Vous recevrez un email de confirmation à votre nouvelle adresse.
		</p>
		<form class="flex flex-col gap-6">
			<Input
				v-model="newEmail"
				label="Nouvelle adresse mail"
				type="email"
				:validate="/\S+@\S+\.\S+/"
				placeholder="mail@example.com"
				required
			>
				<template #error>
					Veuillez entrer une adresse email valide.
				</template>
			</Input>
			<div class="flex justify-center items-center gap-4 w-full">
				<Button
					label="Confirmer"
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
