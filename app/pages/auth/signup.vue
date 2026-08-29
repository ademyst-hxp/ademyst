<script lang="ts" setup>
import { HomeIcon } from "@heroicons/vue/24/solid";
import { ChevronLeftIcon } from "@heroicons/vue/24/outline";

import Box from "~/components/base/Box.vue";
import Button from "~/components/Button.vue";
import Input from "~/components/Input.vue";

const step = ref<number>(0);

const regex = {
	email: /\S+@\S+\.\S+/,
	password: /^(?=.*[A-Za-z])(?=.*\d)\S{8,}$/,
	name: /^[a-zA-Z0-9_\.]{3,16}$/,
};

const payload = ref<{
	email: string;
	password: string;
	confirm_password: string;
	name: string;
	display_name: string;
	birthday: string;
	country: string;
	profile_visibility: boolean;
}>({
	email: "",
	password: "",
	confirm_password: "",
	name: "",
	display_name: "",
	birthday: "",
	country: "",
	profile_visibility: false,
});

const valid = computed(() => ({
	email:
		payload.value.email.length > 0 && regex.email.test(payload.value.email),
	password:
		payload.value.password.length >= 8 &&
		regex.password.test(payload.value.password),
	password_confirmation:
		payload.value.password === payload.value.confirm_password,
	name:
		payload.value.name.length > 3 &&
		payload.value.name.length < 17 &&
		regex.name.test(payload.value.name),
	display_name:
		payload.value.display_name.length > 0 &&
		payload.value.display_name.length < 33,
	birthday: payload.value.birthday.length > 0,
	country: true,
	profile_visibility: true,
}));

const handleSignup = async () => {
	try {
		await $fetch("/api/v1/auth/signup", {
			method: "POST",
			body: payload.value,
		});
		// Rediriger ou afficher un message de succès
	} catch (error) {
		// Gérer les erreurs de connexion
		console.error("Signup failed:", error);
	}
};

useHead({
	title: "Inscription | Ademyst",
	meta: [
		{
			name: "description",
			content: "Créez un compte Beam pour accéder à toutes les fonctionnalités.",
		},
		{
			name: "keywords",
			content: "Beam, Ademyst, Inscription",
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
			class="bg-[url('/images/splash_1.png')] bg-cover bg-center max-md:h-48 md:w-1/2"
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
					Créer un compte ({{ step + 1 }}/3)
				</h1>
				<form v-if="step === 0" class="flex flex-col gap-6">
					<Input
						v-model="payload.email"
						label="Adresse mail liée au compte"
						type="email"
						placeholder="mail@example.com"
						:validate="regex.email"
						required
					>
						<template #error>
							Veuillez entrer une adresse email valide.
						</template>
					</Input>
					<Input
						v-model="payload.password"
						label="Mot de passe"
						type="password"
						placeholder="mdp#123"
						:validate="regex.password"
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
					<Input
						v-model="payload.confirm_password"
						label="Confirmer le mot de passe"
						type="password"
						placeholder="mdp#123"
						:invalid="!valid.password_confirmation"
						required
					>
						<template #error>
							Les mots de passe ne correspondent pas.
						</template>
					</Input>
					<div class="flex justify-center items-center gap-2 w-full">
						<Button
							label="Suivant"
							size="medium"
							:handler="
								() => {
									if (valid.email && valid.password) step = 1;
								}
							"
							:disabled="!valid.email || !valid.password"
						/>
					</div>
				</form>
				<form v-if="step === 1" class="flex flex-col gap-6">
					<Input
						v-model="payload.name"
						label="Nom du profil"
						type="name"
						placeholder="JohnDoe627"
						:validate="regex.name"
						required
					/>
					<Input
						v-model="payload.display_name"
						label="Nom d'affichage"
						type="text"
						placeholder="John Doe"
					/>
					<div class="flex justify-center items-center gap-4 w-full">
						<Button
							label="Précédent"
							:icon=ChevronLeftIcon
							size="medium"
							variant="tertiary"
							:handler="() => step = step - 1"
						/>
						<Button
							label="S'inscrire"
							size="medium"
							:handler="handleSignup"
						/>
					</div>
				</form>
				<form v-if="step === 2" class="flex flex-col gap-6">
					<Input
						v-model="payload.email"
						label="Adresse mail"
						type="email"
						placeholder="mail@example.com"
						:validate="regex.email"
						required
					/>
					<Input
						v-model="payload.password"
						label="Mot de passe"
						type="password"
						placeholder="mdp#123"
						:validate="regex.password"
						required
					/>
					<div class="flex justify-center items-center gap-4 w-full">
						<Button
							label="S'inscrire"
							size="medium"
							:handler="handleSignup"
						/>
					</div>
				</form>
			</Box>
			<div class="flex justify-center items-center gap-2">
				<span class="text-muted max-sm:hidden">Déjà un compte ?</span>
				<Button
					label="Se connecter"
					variant="link"
					handler="/auth/login"
				/>
			</div>
		</div>
	</header>
</template>
