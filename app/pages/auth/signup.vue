<script lang="ts" setup>
import { HomeIcon } from "@heroicons/vue/24/solid";

import Box from "~/components/base/Box.vue";
import Button from "~/components/Button.vue";
import Input from "~/components/Input.vue";
import Avatar from "~/components/profile/Avatar.vue";

const { error, login, refresh, session } = useAuthSession();

await refresh();

const step = ref<number>(0);

const regex = {
	email: /\S+@\S+\.\S+/,
	password: /^(?=.*[A-Za-z])(?=.*\d)\S{8,}$/,
	sudo: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
	referrer: /^[A-Fa-f0-9]{6,10}$/,
};

const referrer = useRoute().query.referrer as string | undefined;

const payload = ref<{
	email: string;
	password: string;
	confirm_password: string;
	token: string;
	termsOfServiceConsent: boolean;
	privacyPolicyConsent: boolean;
	referrer: string | null;
}>({
	email: "",
	password: "",
	confirm_password: "",
	token: "",
	termsOfServiceConsent: false,
	privacyPolicyConsent: false,
	referrer: referrer ?? null,
});

const valid = computed(() => ({
	email:
		payload.value.email.length > 0 && regex.email.test(payload.value.email),
	password:
		payload.value.password.length >= 8 &&
		regex.password.test(payload.value.password),
	password_confirmation:
		payload.value.password === payload.value.confirm_password,
	termsOfServiceConsent: payload.value.termsOfServiceConsent,
	privacyPolicyConsent: payload.value.privacyPolicyConsent,
	token:
		payload.value.token.length > 0 && regex.sudo.test(payload.value.token),
	referrer:
		payload.value.referrer !== null &&
		regex.referrer.test(payload.value.referrer),
}));

const signupError = ref<string | null>(null);
const referralError = ref<string | null>(null);
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

const handleSignup = async () => {
	signupError.value = null;

	try {
		const { referrer: _referrer, ...signupPayload } = payload.value;

		await $fetch("/api/v1/auth/signup", {
			method: "POST",
			body: signupPayload,
		});

		await login(payload.value.email, payload.value.password);

		await refresh();

		if (session.value) {
			step.value = 2;
		}
	} catch (error) {
		signupError.value = getApiErrorMessage(
			error,
			"Impossible de créer le compte.",
		);

		console.error("Signup failed:", error);
	}
};

const { $api } = useNuxtApp();

const askEmailConfirmation = async () => {
	confirmationError.value = null;

	try {
		await $api("/auth/ask-email-confirmation", {
			method: "POST",
			body: { email: payload.value.email },
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

const claimReferralLink = async () => {
	referralError.value = null;

	if (!payload.value.referrer) {
		step.value = 3;
		await askEmailConfirmation();
		return;
	}

	try {
		await $api(`/referrals/codes/${payload.value.referrer}/claim`, {
			method: "POST",
		});

		await refresh();
		step.value = 3;
		await askEmailConfirmation();
	} catch (error) {
		referralError.value = getApiErrorMessage(
			error,
			"Impossible de réclamer ce code de parrainage.",
		);
		console.error("Failed to claim referral link:", error);
	}
};

const skipReferral = async () => {
	referralError.value = null;
	step.value = 3;
	await askEmailConfirmation();
};

definePageMeta({
	title: "Inscription | Ademyst",
	description:
		"Créez un compte Ademyst pour accéder à toutes les fonctionnalités.",
	layout: "auth",
});

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
		<h1 class="text-2xl text-center font-bold font-title">
			Créer un compte
		</h1>
		<p
			v-if="session"
			class="flex justify-center items-center gap-2 text-center text-success"
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
		<form
			v-if="step === 0"
			class="flex flex-col gap-6"
			@submit.prevent="step = 1"
		>
			<h2 class="text-xl font-semibold font-title">
				Créer un compte Ademyst
			</h2>
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
									payload.password.length >= 8
										? 'bg-success'
										: 'bg-danger'
								"
							></div>
							Au moins 8 caractères
						</li>
						<li class="flex items-center gap-2">
							<div
								class="inline-block w-2 h-2 rounded-full"
								:class="
									payload.password.match(/[A-Z]/)
										? 'bg-success'
										: 'bg-danger'
								"
							></div>
							Au moins une lettre majuscule
						</li>
						<li class="flex items-center gap-2">
							<div
								class="inline-block w-2 h-2 rounded-full"
								:class="
									payload.password.match(/[a-z]/)
										? 'bg-success'
										: 'bg-danger'
								"
							></div>
							Au moins une lettre minuscule
						</li>
						<li class="flex items-center gap-2">
							<div
								class="inline-block w-2 h-2 rounded-full"
								:class="
									payload.password.match(/[0-9]/)
										? 'bg-success'
										: 'bg-danger'
								"
							></div>
							Au moins un chiffre
						</li>
						<li class="flex items-center gap-2">
							<div
								class="inline-block w-2 h-2 rounded-full"
								:class="
									payload.password.match(/[^A-Za-z0-9]/)
										? 'bg-success'
										: 'bg-danger'
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
			<div class="flex justify-center items-center gap-4 w-full">
				<Button
					label="Suivant"
					size="medium"
					submit
					:disabled="
						!(
							valid.email &&
							valid.password &&
							valid.password_confirmation
						)
					"
				/>
			</div>
		</form>
		<form
			v-if="step === 1"
			class="flex flex-col gap-6"
			@submit.prevent="handleSignup"
		>
			<h2 class="text-xl font-semibold font-title">
				Lier mon compte Beam
			</h2>
			<p class="text-surface-text-muted">
				Jusqu'au 25 octobre 2026, la possession d'un compte
				<a
					href="https://beam.ejnalo.me"
					target="_blank"
					rel="noopener noreferrer"
				>
					Beam
				</a>
				créé avant le 31 aouût 2026 est requise pour créer un compte
				Ademyst. Pour trouver votre code Sudo, accédez aux paramètres
				rubrique «
				<Button
					label="Transférer vers Beam 2027"
					variant="link"
					handler="@:https://beam.ejnalo.me/account/settings?section=transfer"
					class="inline"
				/>
				» puis suivez les instructions.
			</p>
			<p v-if="signupError" class="text-center text-danger">
				{{ signupError }}
			</p>
			<Input
				v-model="payload.token"
				label="Token de vérification (sudo)"
				type="text"
				placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
				:validate="regex.sudo"
				required
			>
				<template #error> Le token sudo est invalide. </template>
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
			<p class="text-surface-text-muted text-sm">
				En vous inscrivant, vous acceptez nos
				<Button
					label="conditions d'utilisation"
					variant="link"
					handler="/legal/terms-of-service"
					class="inline"
				/>
				et notre
				<Button
					label="politique de confidentialité"
					variant="link"
					handler="/legal/privacy-policy"
					class="inline"
				/>
				.
			</p>
			<div class="flex justify-center items-center gap-4 w-full">
				<Button
					label="M'inscrire"
					size="medium"
					submit
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
		<form
			v-if="step === 2"
			class="flex flex-col gap-6"
			@submit.prevent="claimReferralLink"
		>
			<h2 class="text-xl font-semibold font-title">
				Parrainage (optionnel)
			</h2>
			<p class="text-surface-text-muted">
				Si vous avez un code de parrainage, entrez-le ci-dessous pour
				obtenir des récompenses. Sinon, vous pouvez ignorer cette étape.
			</p>
			<p v-if="referralError" class="text-center text-danger">
				{{ referralError }}
			</p>
			<Input
				v-model="payload.referrer"
				label="Code de parrainage"
				type="text"
				placeholder="XXXXXXXX"
				:validate="regex.referrer"
			>
				<template #error>
					Le code de parrainage est invalide.
				</template>
			</Input>
			<div class="flex justify-center items-center gap-4 w-full">
				<Button
					label="Valider"
					size="medium"
					submit
					:disabled="!valid.referrer"
				/>
				<Button
					label="Ignorer"
					variant="secondary"
					size="medium"
					:handler="skipReferral"
				/>
			</div>
		</form>
		<div v-if="step === 3" class="flex flex-col gap-6">
			<template v-if="confirmationSent">
				<h2 class="text-xl font-bold font-title">
					E-mail de confirmation envoyé
				</h2>
				<p class="text-surface-text-muted">
					Un e-mail de confirmation a été envoyé à
					{{ payload.email }}. Consultez votre boîte de réception pour
					confirmer votre adresse et accéder à toutes les
					fonctionnalités de votre compte.
				</p>
			</template>
			<template v-else>
				<h2 class="text-xl font-bold font-title">
					L'e-mail de confirmation n'a pas pu être envoyé
				</h2>
				<p class="text-danger">
					Une erreur s'est produite lors de l'envoi de l'e-mail de
					confirmation. Veuillez réessayer.
				</p>
			</template>
			<div class="flex justify-center items-center gap-2 w-full">
				<Button
					label="Renvoyer l'e-mail"
					size="medium"
					:handler="askEmailConfirmation"
				/>
				<Button
					label="Modifier l'adresse e-mail"
					variant="secondary"
					size="medium"
					handler="/auth/sudo?action=change-email"
				/>
			</div>
			<div class="flex justify-center items-center gap-4 w-full">
				<Button
					:label="confirmationSent ? 'Compris' : 'Ignorer'"
					variant="link"
					size="medium"
					handler="/discover"
				/>
			</div>
		</div>
	</Box>
</template>
