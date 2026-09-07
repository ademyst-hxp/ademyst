<script setup lang="ts">
import Box from "~/components/base/Box.vue";

import BadgeInfo from "~/components/profile/BadgeInfo.vue";

import { UserIcon, ChevronRightIcon } from "@heroicons/vue/24/outline";

import {
	type AppearanceSettings,
	defaultAppearanceSettings,
} from "~~/shared/models/settings";

const { session, refresh: refreshSession } = useAuthSession();
await refreshSession();

const { $api } = useNuxtApp();
const { setTheme, initTheme } = useTheme();

if (!session.value) {
	navigateTo("/auth/login");
}

const refresh = async () => {
	Promise.all([await refreshSession(), await refreshSettings()]);
};

definePageMeta({
	title: "Apparence & Accessibilité | Ademyst",
	description: "Modifiez vos paramètres de compte et d'affichage.",
	middleware: ["auth"],
});

useHead({
	title: "Apparence & Accessibilité | Ademyst",
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
	settings: AppearanceSettings;
};

const { data: settings, refresh: refreshSettings } = await useAsyncData(
	"settings-appearance",
	async () => {
		return $api<SettingsResponse>(`/settings/appearance`).then((res) => {
			let r = res.settings;

			payload.value = {
				scheme: r.theme as "light" | "dark" | "system",
				highContrast: r.highContrast,
				fontSize: r.fontSize,
				density: r.uiDensity,
				alter: r.alter,
			};

			return res.settings;
		});
	},
);

onMounted(async () => {
	await refreshSettings();
	initTheme();
});

interface UpdateAppearanceSettingsRequest {
	scheme?: "light" | "dark" | "system";
	highContrast?: boolean;
	fontSize?: number;
	density?: "compact" | "comfortable";
	alter?: boolean;
}

const payload = ref<UpdateAppearanceSettingsRequest>({
	scheme: defaultAppearanceSettings.theme as "light" | "dark" | "system",
	highContrast: defaultAppearanceSettings.highContrast,
	fontSize: defaultAppearanceSettings.fontSize,
	density: defaultAppearanceSettings.uiDensity,
	alter: defaultAppearanceSettings.alter,
});

const saveSettings = async () => {
	if (!session.value) return;

	try {
		await setTheme(payload.value);
		initTheme();
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
	<div class="md:flex">
		<aside class="basis-1/4 max-xl:hidden">
			<!-- Vide -->
		</aside>
		<section
			class="basis-2/3 flex flex-col gap-4 overflow-y-auto p-4 max-md:order-0 md:p-8 xl:basis-2/4"
		>
			<header class="flex flex-col gap-4">
				<h1 class="text-2xl font-bold px-8">
					Apparence & Accessibilité
				</h1>
			</header>
			<main class="flex flex-col gap-8 overflow-visible">
				<p class="text-muted px-8">
					Les badges vous permettent de personnaliser votre profil et
					de montrer vos réalisations.
				</p>
				<section class="flex flex-col gap-4">
					<h2 class="text-xl font-semibold px-8">Thème</h2>
					<p class="text-muted px-8">
						Choisissez le thème de l'application pour une expérience
						visuelle optimale.
					</p>
					<div class="flex flex-col gap-4 px-8">
						<div
							class="flex border-2 border-black/10 rounded-xl w-24 h-12 overflow-hidden"
						>
							<div class="bg-(--clr-primary) grow"></div>
							<div class="bg-(--clr-danger) grow"></div>
							<div class="bg-(--clr-success) grow"></div>
						</div>
					</div>
					<div class="flex gap-4 px-8">
						<div
							key="theme-light-selector"
							class="flex items-center gap-2 cursor-pointer"
							:class="
								payload.scheme == 'light'
									? 'text-primary underline'
									: ''
							"
							@click="
								() => {
									payload.scheme = 'light';
									saveSettings();
								}
							"
						>
							<div
								class="bg-white border-2 border-black/10 rounded-full w-6 h-6"
							></div>
							<p class="font-medium">Clair</p>
						</div>
						<div
							key="theme-dark-selector"
							class="flex items-center gap-2 cursor-pointer"
							:class="
								payload.scheme == 'dark'
									? 'text-primary underline'
									: ''
							"
							@click="
								() => {
									payload.scheme = 'dark';
									saveSettings();
								}
							"
						>
							<div
								class="bg-gray-900 border-2 border-black/10 rounded-full w-6 h-6"
							></div>
							<p class="font-medium">Sombre</p>
						</div>
						<div
							key="theme-system-selector"
							class="flex items-center gap-2 cursor-pointer"
							:class="
								payload.scheme == 'system'
									? 'text-primary underline'
									: ''
							"
							@click="
								() => {
									payload.scheme = 'system';
									saveSettings();
								}
							"
						>
							<div
								class="bg-gray-900 border-6 border-white rounded-full w-6 h-6"
							></div>
							<p class="font-medium">Système</p>
						</div>
					</div>
					<div class="flex flex-col gap-2 px-8">
						<Input
							type="checkbox"
							label="Couleurs altérées"
							v-model="payload.alter"
							@click="saveSettings()"
						/>
						<Input
							type="checkbox"
							label="Contraste élevé"
							v-model="payload.highContrast"
							@click="saveSettings()"
						/>
					</div>
				</section>
				<section class="flex flex-col gap-4">
					<h2 class="text-xl font-semibold px-8">Police et taille</h2>
					<div class="flex items-center gap-2 px-8">
						<p class="font-medium">Taille de la police :</p>
						<Button
							:variant="payload.fontSize == 14 ? 'primary' : 'secondary'"
							size="small"
							label="Petite"
							:handler="() => {
								payload.fontSize = 14;
								saveSettings();
							}"
						/>
						<Button
							:variant="payload.fontSize == 16 ? 'primary' : 'secondary'"
							size="small"
							label="Moyenne"
							:handler="() => {
								payload.fontSize = 16;
								saveSettings();
							}"
						/>
						<Button
							:variant="payload.fontSize == 18 ? 'primary' : 'secondary'"
							size="small"
							label="Grande"
							:handler="() => {
								payload.fontSize = 18;
								saveSettings();
							}"
						/>
					</div>
					<div class="flex items-center gap-2 px-8">
						<p class="font-medium">Densité de l'interface:</p>
						<Button
							:variant="payload.density == 'compact' ? 'primary' : 'secondary'"
							size="small"
							label="Compacte"
							:handler="() => {
								payload.density = 'compact';
								saveSettings();
							}"
						/>
						<Button
							:variant="payload.density == 'comfortable' ? 'primary' : 'secondary'"
							size="small"
							label="Confortable"
							:handler="() => {
								payload.density = 'comfortable';
								saveSettings();
							}"
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
</template>
