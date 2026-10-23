<script setup lang="ts">
import { defaultPrivacySettings } from "~~/shared/models/settings";
import { type PrivacySettings } from "~~/shared/models/settings";

import {
	ChevronLeftIcon,
	EyeSlashIcon,
	GiftIcon,
	GlobeAltIcon,
	HeartIcon,
	IdentificationIcon,
	KeyIcon,
	UserGroupIcon,
	UserIcon,
} from "@heroicons/vue/24/outline";

import Actions from "~/components/base/Actions.vue";
import Info from "~/components/boxes/Info.vue";

const { session, refresh: refreshSession } = useAuthSession();
await refreshSession();

const { $api } = useNuxtApp();

if (!session.value) {
	navigateTo("/auth/login");
}

const refresh = async () => {
	Promise.all([await refreshSession(), await refreshSettings()]);
};

definePageMeta({
	title: "Confidentialité & Vie privée | Ademyst",
	description: "Modifiez vos paramètres de compte et d'affichage.",
	middleware: ["auth"],
});

useHead({
	title: "Confidentialité & Vie privée | Ademyst",
	meta: [
		{
			name: "description",
			content: "Modifiez vos paramètres de compte et d'affichage.",
		},
		{
			name: "keywords",
			content: "Beam, Ademyst, Paramètres",
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

type SettingsResponse = {
	status: "ok";
	settings: PrivacySettings;
};

const { data: settings, refresh: refreshSettings } = await useAsyncData(
	"settings-privacy",
	async () => {
		return $api<SettingsResponse>(`/settings/privacy`).then((res) => {
			let r = res.settings;

			payload.value = {
				profileVisibility: r.profileVisibility,
				birthdayVisibility: r.birthdayVisibility as
					"everyone" | "followers" | "friends" | "me",
				termsOfServiceConsent: r.termsOfServiceConsent,
				privacyPolicyConsent: r.privacyPolicyConsent,
			};

			return res.settings;
		});
	},
);

onMounted(async () => {
	await refreshSettings();
});

interface UpdatePrivacySettingsRequest {
	profileVisibility: "everyone" | "followers" | "me";
	birthdayVisibility: "everyone" | "followers" | "friends" | "me";
	termsOfServiceConsent: boolean;
	privacyPolicyConsent: boolean;
}

const payload = ref<UpdatePrivacySettingsRequest>({
	profileVisibility: defaultPrivacySettings.profileVisibility,
	birthdayVisibility: defaultPrivacySettings.birthdayVisibility as
		"everyone" | "followers" | "friends" | "me",
	termsOfServiceConsent: defaultPrivacySettings.termsOfServiceConsent,
	privacyPolicyConsent: defaultPrivacySettings.privacyPolicyConsent,
});

const saveSettings = async () => {
	if (!session.value) return;

	try {
		await $api<SettingsResponse>(`/settings/privacy`, {
			method: "PUT",
			body: payload.value,
		});
		await refreshSettings();
	} catch (error) {
		console.error(
			"Erreur lors de l'enregistrement des paramètres :",
			error,
		);
		alert(
			"Une erreur est survenue lors de l'enregistrement des paramètres.",
		);
	}
};
</script>
<template>
	<Teleport to="#header">
		<nav
			class="grid grid-cols-[auto_1fr_auto] items-center justify-center gap-4"
		>
			<Button
				label="Retour"
				variant="link"
				:icon="ChevronLeftIcon"
				:handler="() => navigateTo('/settings')"
				class="justify-self-start"
			/>
			<h1 class="justify-self-center text-2xl font-bold font-title">
				Confidentialité<template class="max-md:hidden">
					& Vie privée</template
				>
			</h1>
		</nav>
	</Teleport>

	<section class="flex flex-col gap-4">
		<h2 class="text-xl font-semibold font-title">Visibilité</h2>
		<p class="text-muted">
			Choisissez la visibilité par défaut des différentes parties de votre
			compte.
		</p>
		<div class="flex flex-col gap-2">
			<div class="flex items-center gap-2">
				<strong class="flex items-center gap-2">
					<IdentificationIcon class="w-5 h-5" />
					Profil
				</strong>
				<InlineSelect
					label="Visibilité du profil*"
					v-model="payload.profileVisibility"
					:options="[
						{
							label: 'Public',
							value: 'everyone',
							icon: GlobeAltIcon,
						},
						{
							label: 'Privé',
							value: 'followers',
							icon: UserGroupIcon,
						},
					]"
					scale="small"
					class="max-md:hidden"
				/>
				<InlineSelect
					label="Visibilité du profil*"
					v-model="payload.profileVisibility"
					:options="[
						{
							value: 'everyone',
							icon: GlobeAltIcon,
						},
						{
							value: 'followers',
							icon: UserGroupIcon,
						},
					]"
					scale="small"
					class="md:hidden"
				/>
			</div>
			<div class="flex items-center gap-2">
				<strong class="flex items-center gap-2">
					<GiftIcon class="w-5 h-5" />
					Anniversaire
				</strong>
				<InlineSelect
					v-model="payload.birthdayVisibility"
					:options="[
						{
							label: 'Tout le monde',
							value: 'everyone',
							icon: GlobeAltIcon,
						},
						{
							label: 'Abonnés',
							value: 'followers',
							icon: UserGroupIcon,
						},
						{ label: 'Amis', value: 'friends', icon: HeartIcon },
						{ label: 'Privé', value: 'me', icon: EyeSlashIcon },
					]"
					scale="small"
					class="max-md:hidden"
				/>
				<InlineSelect
					v-model="payload.birthdayVisibility"
					:options="[
						{
							value: 'everyone',
							icon: GlobeAltIcon,
						},
						{
							value: 'followers',
							icon: UserGroupIcon,
						},
						{ value: 'friends', icon: HeartIcon },
						{ value: 'me', icon: EyeSlashIcon },
					]"
					scale="small"
					class="md:hidden"
				/>
			</div>

			<p>
				*La visibilité de vos publications ne sera pas impactée par les
				paramètres de visibilité du profil. Seul leur apparition dans
				les différents fils sera affectée.
			</p>
		</div>
	</section>
	<section class="flex flex-col gap-4">
		<h2 class="text-xl font-semibold font-title">Consentements</h2>
		<p class="text-muted">
			Gérez vos consentements pour les conditions d'utilisation et la
			politique de confidentialité.
		</p>
		<Info title="Consentement aux conditions d'utilisation">
			<p>
				Votre consentement est nécessaire pour pouvoir utiliser Ademyst
				conformément à ses conditions d'utilisation et à sa politique de
				confidentialité. Si vous souhaitez vous retirer, vous pouvez
				demander la suppresion de votre compte ainsi que de vos données.
			</p>
		</Info>
		<div class="flex flex-col gap-2">
			<Input
				type="checkbox"
				v-model="payload.termsOfServiceConsent"
				label="J'accepte les conditions d'utilisation"
				disabled
			/>
			<Input
				type="checkbox"
				v-model="payload.privacyPolicyConsent"
				label="J'accepte la politique de confidentialité"
				disabled
			/>
		</div>
	</section>
	<section class="flex flex-col gap-4">
		<h2 class="text-xl font-semibold font-title">
			Vous cherchiez peut-être...
		</h2>
		<div class="flex flex-col gap-2">
			<Actions
				scale="sm"
				:actions="[
					{
						label: 'Profil',
						icon: UserIcon,
						handler: '/settings/profile',
					},
					{
						label: 'Compte et accès',
						icon: KeyIcon,
						handler: '/settings/account',
					},
				]"
			/>
		</div>
	</section>
</template>
