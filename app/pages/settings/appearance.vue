<script setup lang="ts">
import {
	type AppearanceSettings,
	defaultAppearanceSettings,
} from "~~/shared/models/settings";

import {
	ChevronLeftIcon,
} from "@heroicons/vue/24/outline";

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
	scheme: (settings.value?.theme || defaultAppearanceSettings.theme) as "light" | "dark" | "system",
	highContrast: (settings.value?.highContrast || defaultAppearanceSettings.highContrast),
	fontSize: (settings.value?.fontSize || defaultAppearanceSettings.fontSize),
	density: (settings.value?.uiDensity || defaultAppearanceSettings.uiDensity),
	alter: (settings.value?.alter || defaultAppearanceSettings.alter),
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
	<Teleport to="#header">
		<nav class="grid grid-cols-[auto_1fr_auto] items-center justify-center gap-4">
			<Button
				label="Retour"
				variant="link"
				:icon="ChevronLeftIcon"
				:handler="() => navigateTo('/settings')"
				class="justify-self-start"
			/>
			<h1 class="justify-self-center text-2xl font-bold font-title">Apparence & Accessibilité</h1>
		</nav>
	</Teleport>

	<section class="flex flex-col gap-4">
		<h2 class="text-xl font-semibold font-title">Thème</h2>
		<p class="text-muted">
			Choisissez le thème de l'application pour une expérience visuelle
			optimale.
		</p>
		<div class="flex flex-col gap-4">
			<div
				class="flex border-2 border-black/10 rounded-xl w-24 h-12 overflow-hidden"
			>
				<div class="bg-(--clr-primary) grow"></div>
				<div class="bg-(--clr-danger) grow"></div>
				<div class="bg-(--clr-success) grow"></div>
			</div>
		</div>
		<div class="flex gap-4">
			<div
				key="theme-light-selector"
				class="flex items-center gap-2 cursor-pointer"
				:class="
					payload.scheme == 'light' ? 'text-primary underline' : ''
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
					payload.scheme == 'dark' ? 'text-primary underline' : ''
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
					payload.scheme == 'system' ? 'text-primary underline' : ''
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
		<div class="flex flex-col gap-2">
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
		<h2 class="text-xl font-semibold font-title">Police et taille</h2>
		<div class="flex items-center gap-2">
			<p class="font-medium">Taille de la police :</p>
			<Button
				:variant="payload.fontSize == 14 ? 'primary' : 'secondary'"
				size="small"
				label="Petite"
				:handler="
					() => {
						payload.fontSize = 14;
						saveSettings();
					}
				"
			/>
			<Button
				:variant="payload.fontSize == 16 ? 'primary' : 'secondary'"
				size="small"
				label="Moyenne"
				:handler="
					() => {
						payload.fontSize = 16;
						saveSettings();
					}
				"
			/>
			<Button
				:variant="payload.fontSize == 18 ? 'primary' : 'secondary'"
				size="small"
				label="Grande"
				:handler="
					() => {
						payload.fontSize = 18;
						saveSettings();
					}
				"
			/>
		</div>
		<div class="flex items-center gap-2">
			<p class="font-medium">Densité de l'interface:</p>
			<Button
				:variant="
					payload.density == 'compact' ? 'primary' : 'secondary'
				"
				size="small"
				label="Compacte"
				:handler="
					() => {
						payload.density = 'compact';
						saveSettings();
					}
				"
			/>
			<Button
				:variant="
					payload.density == 'comfortable' ? 'primary' : 'secondary'
				"
				size="small"
				label="Confortable"
				:handler="
					() => {
						payload.density = 'comfortable';
						saveSettings();
					}
				"
			/>
		</div>
	</section>
</template>
