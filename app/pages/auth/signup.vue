<script lang="ts" setup>
import { HomeIcon } from "@heroicons/vue/24/solid";

import Box from "~/components/base/Box.vue";
import Button from "~/components/Button.vue";
import Input from "~/components/Input.vue";
import Avatar from "~/components/profile/Avatar.vue";

const { error, login, refresh, session } = useAuthSession();

await refresh();

const step = ref<number>(0);

// Ces valeurs doivent rester identiques à celles de l'endpoint /api/v1/auth/signup.
const MIN_AGE = 15;
const MIN_BIRTH_YEAR = 1900;
const DISPLAY_NAME_MAX_LENGTH = 32;

const regex = {
	email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
	// 3 à 16 caractères, commence par une lettre minuscule.
	username: /^[a-z][a-z0-9_]{2,15}$/,
	// Au moins 8 caractères, une minuscule, une majuscule, un chiffre et un caractère spécial.
	password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/,
	referrer: /^[A-Fa-f0-9]{6,10}$/,
};

const queryReferrer = useRoute().query.referrer;
const referrer = typeof queryReferrer === "string" ? queryReferrer : null;

const payload = ref<{
	email: string;
	username: string;
	displayName: string;
	password: string;
	confirm_password: string;
	birthday: string;
	termsOfServiceConsent: boolean;
	privacyPolicyConsent: boolean;
	referrer: string | null;
}>({
	email: "",
	username: "",
	displayName: "",
	password: "",
	confirm_password: "",
	birthday: "",
	termsOfServiceConsent: false,
	privacyPolicyConsent: false,
	referrer,
});

// Les pseudos sont toujours en minuscules et sans espaces (comme côté serveur).
watch(
	() => payload.value.username,
	(value) => {
		const normalized = value.toLowerCase().replace(/\s/g, "");

		if (normalized !== value) {
			payload.value.username = normalized;
		}
	},
);

// Calcule l'âge exact à partir d'une date "AAAA-MM-JJ". Renvoie null si la date est invalide.
const getAge = (value: string): number | null => {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

	if (!match) {
		return null;
	}

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);

	const date = new Date(Date.UTC(year, month - 1, day));

	if (
		year < MIN_BIRTH_YEAR ||
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return null;
	}

	const today = new Date();
	let age = today.getFullYear() - year;

	if (
		today.getMonth() + 1 < month ||
		(today.getMonth() + 1 === month && today.getDate() < day)
	) {
		age--;
	}

	return age;
};

const valid = computed(() => {
	const age = getAge(payload.value.birthday);
	const displayName = payload.value.displayName.trim();

	return {
		email: regex.email.test(payload.value.email),
		username: regex.username.test(payload.value.username),
		displayName:
			displayName.length > 0 &&
			displayName.length <= DISPLAY_NAME_MAX_LENGTH,
		password: regex.password.test(payload.value.password),
		password_confirmation:
			payload.value.password === payload.value.confirm_password,
		termsOfServiceConsent: payload.value.termsOfServiceConsent,
		privacyPolicyConsent: payload.value.privacyPolicyConsent,
		birthday: age !== null && age >= MIN_AGE,
		referrer:
			payload.value.referrer !== null &&
			regex.referrer.test(payload.value.referrer),
	};
});

const credentialsValid = computed(
	() =>
		valid.value.email &&
		valid.value.password &&
		valid.value.password_confirmation,
);

const profileValid = computed(
	() =>
		credentialsValid.value &&
		valid.value.username &&
		valid.value.displayName &&
		valid.value.birthday,
);

const consentValid = computed(
	() =>
		valid.value.termsOfServiceConsent && valid.value.privacyPolicyConsent,
);

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

const backToProfile = () => {
	signupError.value = null;
	step.value = 1;
};

const handleSignup = async () => {
	signupError.value = null;

	if (!profileValid.value || !consentValid.value) {
		return;
	}

	// Mêmes normalisations que côté serveur, pour que la connexion automatique réussisse.
	const email = payload.value.email.trim().toLowerCase();
	const username = payload.value.username.trim().toLowerCase();

	try {
		await $fetch("/api/v1/auth/signup", {
			method: "POST",
			body: {
				email,
				password: payload.value.password,
				username,
				display_name: payload.value.displayName.trim(),
				birthday: payload.value.birthday,
				termsOfServiceConsent: payload.value.termsOfServiceConsent,
				privacyPolicyConsent: payload.value.privacyPolicyConsent,
			},
		});

		payload.value.email = email;
		payload.value.username = username;

		await login(email, payload.value.password);

		await refresh();

		if (session.value) {
			step.value = 3;
		} else {
			signupError.value =
				"Compte créé, mais la connexion automatique a échoué. Connectez-vous pour continuer.";
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

	// Les codes sont stockés en majuscules côté serveur.
	const code = payload.value.referrer?.trim().toUpperCase();

	if (!code) {
		step.value = 4;
		await askEmailConfirmation();
		return;
	}

	if (!regex.referrer.test(code)) {
		referralError.value = "Le code de parrainage est invalide.";
		return;
	}

	try {
		await $api(`/referrals/codes/${encodeURIComponent(code)}/claim`, {
			method: "POST",
		});

		await refresh();
		step.value = 4;
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
	step.value = 4;
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
					:disabled="!credentialsValid"
				/>
			</div>
		</form>
		<form
			v-if="step === 1"
			class="flex flex-col gap-6"
			@submit.prevent="step = 2"
		>
			<h2 class="text-xl font-semibold font-title">
				Informations sur le profil
			</h2>
			<Input
				v-model="payload.username"
				label="Nom d'utilisateur"
				type="text"
				placeholder="john_doe"
				:validate="regex.username"
				required
			>
				<template #indications>
					Le nom d'utilisateur est unique et sert à vous identifier.
					Vous pourrez le changer plus tard dans les paramètres de
					votre compte.
				</template>
				<template #error>
					Le nom d'utilisateur doit contenir uniquement des lettres
					minuscules, chiffres et underscores (_). Il doit commencer
					par une lettre et avoir entre 3 et 16 caractères.
				</template>
			</Input>
			<Input
				v-model="payload.displayName"
				label="Nom d'affichage"
				type="text"
				placeholder="John Doe"
				:invalid="payload.displayName.length > 0 && !valid.displayName"
				required
			>
				<template #indications>
					Le nom d'affichage est le nom que les autres utilisateurs
					verront. Il peut contenir n'importe quels caractères et doit
					avoir {{ DISPLAY_NAME_MAX_LENGTH }} caractères maximum.
				</template>
				<template #error>
					Le nom d'affichage doit contenir entre 1 et
					{{ DISPLAY_NAME_MAX_LENGTH }} caractères.
				</template>
			</Input>
			<Input
				v-model="payload.birthday"
				label="Date de naissance"
				type="date"
				placeholder="1990-01-01"
				:invalid="payload.birthday.length > 0 && !valid.birthday"
				required
			>
				<template #error>
					Date de naissance invalide : vous devez avoir au moins
					{{ MIN_AGE }} ans.
				</template>
			</Input>
			<div class="flex justify-center items-center gap-4 w-full">
				<Button
					label="Suivant"
					size="medium"
					submit
					:disabled="!profileValid"
				/>
			</div>
		</form>
		<form
			v-if="step === 2"
			class="flex flex-col gap-6"
			@submit.prevent="handleSignup"
		>
			<h2 class="text-xl font-semibold font-title">Consentement</h2>
			<p v-if="signupError" class="text-center text-danger">
				{{ signupError }}
			</p>
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
					label="Retour"
					variant="secondary"
					size="medium"
					:handler="backToProfile"
				/>
				<Button
					label="M'inscrire"
					size="medium"
					submit
					:disabled="!(profileValid && consentValid)"
				/>
			</div>
		</form>
		<form
			v-if="step === 3"
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
		<div v-if="step === 4" class="flex flex-col gap-6">
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
