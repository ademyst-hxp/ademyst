<script setup lang="ts">
import { AtSymbolIcon, KeyIcon, HomeIcon } from "@heroicons/vue/24/solid";

import Box from "~/components/base/Box.vue";
import Button from "~/components/Button.vue";
import Avatar from "~/components/profile/Avatar.vue";

const { error, login, refresh, session } = useAuthSession();

const { $api } = useNuxtApp();

const password = ref("");
const token = useRoute().query.sudo as string;
const passwordRegex =
	/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,}$/;

await refresh();

const handleAccountDeletion = async () => {
	await $api("/account/delete", {
		method: "POST",
		body: { token },
	});

	// await navigateTo("/auth/login");
};

definePageMeta({
	title: "Suppression du compte | Ademyst",
	description: "Supprimez votre compte Ademyst.",
	layout: "auth",
});

useHead({
	title: "Suppression du compte | Ademyst",
	meta: [
		{
			name: "description",
			content: "Supprimez votre compte Ademyst.",
		},
		{
			name: "keywords",
			content: "Beam, Ademyst, Suppression du compte",
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
	<Teleport to="#header">
		<h1 class="text-2xl font-bold text-center">Supprimer mon compte</h1>
	</Teleport>
	<!--section
		class="bg-surface text-surface-text border border-surface-border rounded-3xl px-6 py-4"
	>
		<h2 class="text-lg font-semibold mb-2">Exporter mes données</h2>
		<p class="text-surface-text-muted text-sm">
			Si vous souhaitez récupérer les données collectées sur vous avant de
			supprimer votre compte, vous pouvez vous rendre dans vos paramètres,
			rubrique "Confidentialité & Vie Privée" pour les exporter. Vous
			pourrez, après ça, supprimer votre compte de manière définitive une
			fois que vous les aurez reçues.
		</p>
		<Button
			:icon="AtSymbolIcon"
			label="Exporter mes données"
			variant="primary"
			size="medium"
			handler="/settings/privacy#export-data?intent=delete-account"
		/>
	</section-->
	<section
		class="flex flex-col gap-2 bg-surface text-surface-text border border-surface-border rounded-3xl px-6 py-4"
	>
		<h2 class="text-xl font-semibold font-title">Procéder à la suppression</h2>
		<p v-if="session" class="flex justify-start items-center gap-2 text-danger">
			Connecté en tant que
			<span class="flex items-center gap-1">
				<Avatar
					:src="`/api/v1/users/${session.profile.name}/avatar.webp`"
					size="sm"
				/>
				{{ session.profile.name }}
			</span>.
		</p>
		<p class="text-surface-text-muted text-sm">
			<b>Cette action est irréversible.</b> Toutes vos données seront
			supprimées de nos serveurs et vous ne pourrez plus accéder à votre
			compte. Si vous êtes sûr.e de vouloir continuer, cliquez sur le bouton
			ci-dessous pour procéder à la suppression de votre compte.
		</p>
		<Button
			label="Supprimer mon compte"
			variant="primary"
			size="medium"
			:handler="handleAccountDeletion"
		/>
	</section>
</template>
