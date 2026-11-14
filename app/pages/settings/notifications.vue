<script setup lang="ts">
import {
	BellIcon,
	ChevronLeftIcon,
	EyeIcon,
	KeyIcon,
} from "@heroicons/vue/24/outline";

import { NOTIFICATION_CATEGORY_META } from "~~/shared/consts/notifications";
import {
	NOTIFICATION_CATEGORIES,
	type NotificationCategory,
} from "~~/shared/models/inbox";
import {
	defaultNotificationSettings,
	type NotificationEmailSetting,
	type NotificationSettings,
} from "~~/shared/models/settings";
import type { Account } from "~~/shared/models/accounts";

import Actions from "~/components/base/Actions.vue";
import Box from "~/components/base/Box.vue";
import Info from "~/components/boxes/Info.vue";
import WarningBox from "~/components/boxes/Warning.vue";
import SettingRow from "~/components/notifications/SettingRow.vue";
import { NOTIFICATION_CATEGORY_ICONS } from "~/utils/notifications";

const { session, refresh: refreshSession } = useAuthSession();
await refreshSession();

const { $api } = useNuxtApp();

if (!session.value) {
	navigateTo("/auth/login");
}

definePageMeta({
	title: "Notifications et mails | Ademyst",
	description: "Choisissez les notifications que vous recevez par e-mail.",
	middleware: ["auth"],
});

useHead({
	title: "Notifications et mails | Ademyst",
	meta: [
		{
			name: "description",
			content: "Choisissez les notifications que vous recevez par e-mail.",
		},
	],
});

/* -------------------------------------------------------------------------- */
/*  Catégories                                                                */
/* -------------------------------------------------------------------------- */

// Sécurité et modération n'ont pas de réglage : toujours envoyées par mail.
const forcedCategories = NOTIFICATION_CATEGORIES.filter(
	(category) => NOTIFICATION_CATEGORY_META[category].setting === null,
);
const optionalCategories = NOTIFICATION_CATEGORIES.filter(
	(category) => NOTIFICATION_CATEGORY_META[category].setting !== null,
);

const settingOf = (category: NotificationCategory): NotificationEmailSetting =>
	NOTIFICATION_CATEGORY_META[category].setting!;

// À tenir à jour avec NOTIFICATION_TYPE_META (types dont la politique mail
// est "never" dans shared/consts/notifications.ts).
const NOTES: Partial<Record<NotificationCategory, string>> = {
	content:
		"Les pensées ne sont jamais envoyées par e-mail : elles disparaissent après 24 h.",
	interactions:
		"Les simples réactions ne sont jamais envoyées par e-mail ; les paliers atteints et les réponses le sont.",
};

/* -------------------------------------------------------------------------- */
/*  Données                                                                   */
/* -------------------------------------------------------------------------- */

type SettingsResponse = {
	status: "ok";
	settings: NotificationSettings;
};

type EmailSettingsPayload = Record<NotificationEmailSetting, boolean>;

const toPayload = (settings: NotificationSettings): EmailSettingsPayload => {
	const payload = {} as EmailSettingsPayload;
	for (const category of optionalCategories) {
		const key = settingOf(category);
		payload[key] = settings[key];
	}
	return payload;
};

const payload = ref<EmailSettingsPayload>(
	toPayload(defaultNotificationSettings),
);
// Dernier état connu du serveur : sert à détecter les modifications et à
// réinitialiser le formulaire.
const saved = ref<EmailSettingsPayload>(toPayload(defaultNotificationSettings));

const { error: loadError, refresh: reload } = await useAsyncData(
	"settings-notifications",
	async () => {
		const response = await $api<SettingsResponse>("/settings/notifications");
		saved.value = toPayload(response.settings);
		payload.value = { ...saved.value };
		return response.settings;
	},
);

type AccountResponse = { status: "ok"; data: Account };
const { data: account } = await useAsyncData("settings-account", async () => {
	return (await $api<AccountResponse>("/account")).data;
});

const dirty = computed(() =>
	optionalCategories.some(
		(category) =>
			payload.value[settingOf(category)] !== saved.value[settingOf(category)],
	),
);

/* -------------------------------------------------------------------------- */
/*  Actions                                                                   */
/* -------------------------------------------------------------------------- */

const status = ref<{ kind: "success" | "error"; message: string } | null>(
	null,
);

const saveSettings = async () => {
	status.value = null;

	try {
		const response = await $api<SettingsResponse>("/settings/notifications", {
			method: "PUT",
			body: payload.value,
		});
		saved.value = toPayload(response.settings);
		payload.value = { ...saved.value };
		status.value = { kind: "success", message: "Réglages enregistrés." };
	} catch (error) {
		console.error("Erreur lors de l'enregistrement des réglages :", error);
		status.value = {
			kind: "error",
			message:
				"Une erreur est survenue lors de l'enregistrement des réglages.",
		};
	}
};

const resetSettings = () => {
	payload.value = { ...saved.value };
	status.value = null;
};

// Une nouvelle modification efface le message de la dernière sauvegarde.
// On suit `dirty` et non `payload` : l'enregistrement remplace `payload`
// et effacerait aussitôt son propre message de confirmation.
watch(dirty, (isDirty) => {
	if (isDirty) status.value = null;
});
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
				Notifications<template class="max-md:hidden">
					et mails</template
				>
			</h1>
		</nav>
	</Teleport>

	<WarningBox
		v-if="account?.email && !account.confirmedAt"
		title="Adresse e-mail non confirmée"
	>
		Confirmez votre adresse e-mail pour être sûr de recevoir les mails
		ci-dessous.
		<RouterLink
			to="/settings/account"
			class="font-semibold hover:underline"
		>
			Compte et accès
		</RouterLink>
	</WarningBox>

	<p v-if="loadError" class="py-8 text-center text-sm text-danger">
		Impossible de récupérer vos réglages.
		<button class="font-semibold underline" @click="reload()">
			Réessayer
		</button>
	</p>

	<template v-else>
		<section class="flex flex-col gap-4">
			<h2 class="text-xl font-semibold font-title">E-mails</h2>
			<p class="text-muted">
				Toutes les notifications apparaissent toujours dans votre
				<RouterLink to="/inbox" class="font-semibold text-primary hover:underline">
					boîte de réception</RouterLink
				>. Choisissez ici celles qui vous sont aussi envoyées par
				e-mail<template v-if="account?.email">
					à <strong>{{ account.email }}</strong></template
				>.
			</p>

			<Box layout="vertical-divide" scale="sm">
				<SettingRow
					v-for="category in optionalCategories"
					:key="category"
					v-model="payload[settingOf(category)]"
					:icon="NOTIFICATION_CATEGORY_ICONS[category]"
					:label="NOTIFICATION_CATEGORY_META[category].label"
					:description="NOTIFICATION_CATEGORY_META[category].description"
					:note="NOTES[category]"
				/>
			</Box>

			<div class="flex flex-wrap items-center gap-2">
				<Button
					label="Enregistrer"
					variant="primary"
					:disabled="!dirty"
					:handler="saveSettings"
				/>
				<Button
					label="Réinitialiser"
					variant="secondary"
					:disabled="!dirty"
					:handler="resetSettings"
				/>
				<p
					v-if="status"
					class="text-sm font-medium"
					:class="
						status.kind === 'success' ? 'text-success-darkened' : 'text-danger'
					"
					role="status"
				>
					{{ status.message }}
				</p>
			</div>
		</section>

		<section class="flex flex-col gap-4">
			<h2 class="text-xl font-semibold font-title">Toujours envoyés</h2>
			<Info title="Pour votre sécurité">
				Les notifications de sécurité et de modération sont toujours
				envoyées par e-mail et ne peuvent pas être désactivées : elles
				concernent la protection de votre compte et les décisions qui le
				concernent.
			</Info>
			<Box layout="vertical-divide" scale="sm">
				<SettingRow
					v-for="category in forcedCategories"
					:key="category"
					:model-value="true"
					locked
					:icon="NOTIFICATION_CATEGORY_ICONS[category]"
					:label="NOTIFICATION_CATEGORY_META[category].label"
					:description="NOTIFICATION_CATEGORY_META[category].description"
				/>
			</Box>
		</section>

		<section class="flex flex-col gap-4">
			<h2 class="text-xl font-semibold font-title">
				Vous cherchiez peut-être...
			</h2>
			<Actions
				scale="sm"
				:actions="[
					{
						label: 'Boîte de réception',
						icon: BellIcon,
						handler: '/inbox',
					},
					{
						label: 'Compte et accès',
						icon: KeyIcon,
						handler: '/settings/account',
					},
					{
						label: 'Apparence et accessibilité',
						icon: EyeIcon,
						handler: '/settings/appearance',
					},
				]"
			/>
		</section>
	</template>
</template>
