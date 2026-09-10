<script setup lang="ts">
import Box from "~/components/base/Box.vue";
import Actions from "~/components/base/Actions.vue";

import {
	UserIcon,
	IdentificationIcon,
	GiftIcon,
	KeyIcon,
	ChevronRightIcon,
	GlobeAltIcon,
	UserGroupIcon,
	HeartIcon,
	EyeSlashIcon,
	ChevronLeftIcon,
} from "@heroicons/vue/24/outline";

import {
	type PrivacySettings,
	defaultPrivacySettings,
} from "~~/shared/models/settings";
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
				birthdayVisibility: r.birthdayVisibility,
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
	birthdayVisibility: Omit<PrivacySettings["birthdayVisibility"], "custom">;
	termsOfServiceConsent: boolean;
	privacyPolicyConsent: boolean;
}

const payload = ref<UpdatePrivacySettingsRequest>({
	profileVisibility: defaultPrivacySettings.profileVisibility,
	birthdayVisibility: defaultPrivacySettings.birthdayVisibility,
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

const isProfileVisibilityMenuOpen = ref(false);
const isBirthdayVisibilityMenuOpen = ref(false);
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
			<h1 class="justify-self-center text-2xl font-bold">
				Confidentialité<template class="max-md:hidden"> & Vie privée</template>
			</h1>
		</nav>
	</Teleport>

	<section class="flex flex-col gap-4">
		<h2 class="text-xl font-semibold">Visibilité</h2>
		<p class="text-muted">
			Choisissez la visibilité par défaut des différentes parties de votre
			compte.
		</p>
		<div class="flex flex-col gap-2">
			<Actions
				scale="sm"
				:actions="[
					{
						label: 'Profil',
						icon: IdentificationIcon,
						handler: () => {
							isProfileVisibilityMenuOpen = true;
						},
						indicator:
							payload.profileVisibility == 'everyone'
								? 'Public'
								: 'Privé',
					},
					{
						label: 'Anniversaire',
						icon: GiftIcon,
						handler: () => {
							isBirthdayVisibilityMenuOpen = true;
						},
						indicator:
							payload.birthdayVisibility == 'everyone'
								? 'Tout le monde'
								: payload.birthdayVisibility == 'followers'
									? 'Abonnés'
									: payload.birthdayVisibility == 'friends'
										? 'Amis'
										: 'Privé',
					},
				]"
			/>
			<p>
				*La visibilité de vos publications ne sera pas impactée par les
				paramètres de visibilité du profil. Seul leur apparition dans
				les différents fils sera affectée.
			</p>
		</div>
	</section>
	<section class="flex flex-col gap-4">
		<h2 class="text-xl font-semibold">Consentements</h2>
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
		<h2 class="text-xl font-semibold">Vous cherchiez peut-être...</h2>
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
	<Menu
		v-if="isProfileVisibilityMenuOpen"
		@close="isProfileVisibilityMenuOpen = false"
		:title="'Visibilité du profil'"
		:actions="[
			{
				label: 'Public',
				icon: GlobeAltIcon,
				handler: () => {
					payload.profileVisibility = 'everyone';
				},
			},
			{
				label: 'Privé',
				icon: UserGroupIcon,
				handler: () => {
					payload.profileVisibility = 'followers';
				},
			},
		]"
	/>
	<Menu
		v-if="isBirthdayVisibilityMenuOpen"
		@close="isBirthdayVisibilityMenuOpen = false"
		:title="'Visibilité de mon anniversaire'"
		:actions="[
			{
				label: 'Tout le monde',
				icon: GlobeAltIcon,
				handler: () => {
					payload.birthdayVisibility = 'everyone';
				},
			},
			{
				label: 'Abonnés',
				icon: UserGroupIcon,
				handler: () => {
					payload.birthdayVisibility = 'followers';
				},
			},
			{
				label: 'Amis',
				icon: HeartIcon,
				handler: () => {
					payload.birthdayVisibility = 'friends';
				},
			},
			{
				label: 'Privé',
				icon: EyeSlashIcon,
				handler: () => {
					payload.birthdayVisibility = 'me';
				},
			},
		]"
	/>
</template>
