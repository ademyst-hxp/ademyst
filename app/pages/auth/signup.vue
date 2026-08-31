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
	sudo: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
};

const payload = ref<{
	email: string;
	password: string;
	confirm_password: string;
	token: string;
	termsOfServiceConsent: boolean;
	privacyPolicyConsent: boolean;
}>({
	email: "",
	password: "",
	confirm_password: "",
	token: "",
	termsOfServiceConsent: false,
	privacyPolicyConsent: false,
});

const valid = computed(() => ({
	email:
		payload.value.email.length > 0 && regex.email.test(payload.value.email),
	password:
		payload.value.password.length >= 8 &&
		regex.password.test(payload.value.password),
	password_confirmation:
		payload.value.password === payload.value.confirm_password,
	termsOfServiceConsent:
		payload.value.termsOfServiceConsent,
	privacyPolicyConsent:
		payload.value.privacyPolicyConsent,
	token:
		payload.value.token.length > 0 && regex.sudo.test(payload.value.token),
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
			content:
				"Créez un compte Ademyst pour accéder à toutes les fonctionnalités.",
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
					Créer un compte
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
							<ul>
								<li class="flex items-center gap-2">
									<div
										class="inline-block w-2 h-2 rounded-full"
										:class="
											payload.password.length >= 8 ? 'bg-success' : 'bg-danger'
										"
									></div>
									Au moins 8 caractères
								</li>
								<li class="flex items-center gap-2">
									<div
										class="inline-block w-2 h-2 rounded-full"
										:class="
											payload.password.match(/[A-Z]/) ? 'bg-success' : 'bg-danger'
										"
									></div>
									Au moins une lettre majuscule
								</li>
								<li class="flex items-center gap-2">
									<div
										class="inline-block w-2 h-2 rounded-full"
										:class="
											payload.password.match(/[a-z]/) ? 'bg-success' : 'bg-danger'
										"
									></div>
									Au moins une lettre minuscule
								</li>
								<li class="flex items-center gap-2">
									<div
										class="inline-block w-2 h-2 rounded-full"
										:class="
											payload.password.match(/[0-9]/) ? 'bg-success' : 'bg-danger'
										"
									></div>
									Au moins un chiffre
								</li>
								<li class="flex items-center gap-2">
									<div
										class="inline-block w-2 h-2 rounded-full"
										:class="
											payload.password.match(/[^A-Za-z0-9]/) ? 'bg-success' : 'bg-danger'
										"
									></div>
									Au moins un caractère spécial
								</li>
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
					<Input
						v-model="payload.token"
						label="Token de vérification (sudo)"
						type="text"
						placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
						:validate="regex.sudo"
						required
					>
						<template #error>
							Le token sudo est invalide.
						</template>
					</Input>
					<Input
						v-model="payload.termsOfServiceConsent"
						label="Accepter les conditions d'utilisation"
						type="checkbox"
						required
					>
						<template #error>
							Vous devez accepter les conditions d'utilisation.
						</template>
					</Input>
					<Input
						v-model="payload.privacyPolicyConsent"
						label="Accepter la politique de confidentialité"
						type="checkbox"
						required
					>
						<template #error>
							Vous devez accepter la politique de confidentialité.
						</template>
					</Input>
					<div class="flex justify-center items-center gap-4 w-full">
						<Button
							label="S'inscrire"
							size="medium"
							:handler="handleSignup"
							:disabled="
								!(
									valid.email &&
									valid.password &&
									valid.password_confirmation &&
									valid.termsOfServiceConsent &&
									valid.privacyPolicyConsent &&
									valid.token
								)
							"
						/>
					</div>
				</form>
			</Box>
		</div>
	</header>
</template>
