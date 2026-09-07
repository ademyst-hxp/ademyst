<script setup lang="ts">
import Box from "~/components/base/Box.vue";

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
	<div class="md:flex">
		<aside class="basis-1/4 max-xl:hidden">
			<!-- Vide -->
		</aside>
		<section
			class="basis-2/3 flex flex-col gap-4 overflow-y-auto p-4 max-md:order-0 md:p-8 xl:basis-2/4"
		>
			<header class="flex flex-col gap-4">
				<h1 class="text-2xl font-bold px-8">
					Paramètres de confidentialité
				</h1>
			</header>
			<main class="flex flex-col gap-8 overflow-visible">
				<section class="flex flex-col gap-4">
					<h2 class="text-xl font-semibold px-8">Visibilité</h2>
					<p class="text-muted px-8">
						Choisissez la visibilité par défaut des différentes
						parties de votre compte.
					</p>
					<div class="flex flex-col gap-2">
						<Box
							scale="sm"
							layout="horizontal"
							class="items-center w-full cursor-pointer hover:scale-101 duration-200 transition-transform"
							@click="isProfileVisibilityMenuOpen = true"
						>
							<div class="flex items-center gap-2 w-full">
								<IdentificationIcon class="h-8 w-8" />
								<p class="grow text-lg font-medium">
									Profil et publications* ({{
										payload.profileVisibility == "everyone"
											? "Public"
											: "Privé"
									}})
								</p>
								<ChevronRightIcon
									class="text-surface-text-muted h-5 w-5"
								/>
							</div>
						</Box>
						<Box
							scale="sm"
							layout="horizontal"
							class="items-center w-full cursor-pointer hover:scale-101 duration-200 transition-transform"
							@click="isBirthdayVisibilityMenuOpen = true"
						>
							<div class="flex items-center gap-2 w-full">
								<GiftIcon class="h-8 w-8" />
								<p class="grow text-lg font-medium">
									Date de naissance ({{
										payload.birthdayVisibility == "everyone"
											? "Tout le monde"
											: payload.birthdayVisibility ==
												  "followers"
												? "Abonnés"
												: payload.birthdayVisibility ==
													  "friends"
													? "Amis"
													: "Privé"
									}})
								</p>
								<ChevronRightIcon
									class="text-surface-text-muted h-5 w-5"
								/>
							</div>
						</Box>
						<p class="px-8">
							*La visibilité de vos publications ne sera pas
							impactée par les paramètres de visibilité du profil.
							Seul leur apparition dans les différents fils sera
							affectée.
						</p>
					</div>
				</section>
				<section class="flex flex-col gap-4">
					<h2 class="text-xl font-semibold px-8">Consentements</h2>
					<p class="text-muted px-8">
						Gérez vos consentements pour les conditions
						d'utilisation et la politique de confidentialité.
					</p>
					<Info title="Consentement aux conditions d'utilisation">
						<p>
							Votre consentement est nécessaire pour pouvoir
							utiliser Ademyst conformément à ses conditions
							d'utilisation et à sa politique de confidentialité.
							Si vous souhaitez vous retirer, vous pouvez demander
							la suppresion de votre compte ainsi que de vos
							données.
						</p>
					</Info>
					<div class="flex flex-col gap-2 px-8">
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
					<h2 class="text-xl font-semibold px-8">
						Vous cherchiez peut-être...
					</h2>
					<div class="flex flex-col gap-2">
						<Box
							scale="sm"
							layout="horizontal"
							class="items-center w-full cursor-pointer hover:scale-101 duration-200 transition-transform"
							@click="navigateTo('/settings/profile')"
						>
							<div class="flex items-center gap-2 w-full">
								<UserIcon class="h-8 w-8" />
								<p class="grow text-lg font-medium">Profil</p>
								<ChevronRightIcon
									class="text-surface-text-muted h-5 w-5"
								/>
							</div>
						</Box>
						<Box
							scale="sm"
							layout="horizontal"
							class="items-center w-full cursor-pointer hover:scale-101 duration-200 transition-transform"
							@click="navigateTo('/settings/account')"
						>
							<div class="flex items-center gap-2 w-full">
								<KeyIcon class="h-8 w-8" />
								<p class="grow text-lg font-medium">
									Compte et accès
								</p>
								<ChevronRightIcon
									class="text-surface-text-muted h-5 w-5"
								/>
							</div>
						</Box>
					</div>
				</section>
			</main>
			<footer class="flex flex-col gap-4">
				<p class="text-sm text-surface-text/50 px-8">
					<RouterLink
						to="/legal/terms"
						class="font-semibold hover:text-primary hover:underline"
						>CGU</RouterLink
					>
					|
					<RouterLink
						to="/legal/privacy"
						class="font-semibold hover:text-primary hover:underline"
						>Politique de confidentialité</RouterLink
					>
				</p>
			</footer>
		</section>
		<aside
			class="basis-1/4 sticky top-24 flex flex-col gap-4 overflow-y-auto p-4 max-md:order-0 md:p-8 max-xl:hidden"
		></aside>
	</div>
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
