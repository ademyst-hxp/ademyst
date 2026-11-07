<script setup lang="ts">
import { ArrowDownTrayIcon } from "@heroicons/vue/24/outline";

import Box from "~/components/base/Box.vue";
import Button from "~/components/Button.vue";
import Avatar from "~/components/profile/Avatar.vue";

const { refresh, session } = useAuthSession();

const { $api } = useNuxtApp();

const token = useRoute().query.sudo as string;

await refresh();

const handleAccountDeletion = async () => {
	await $api("/account/delete", {
		method: "POST",
		body: { token },
	});

	// Rediriger vers la page de connexion
	await navigateTo("/auth/login");
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
	<Box>
		<h2 class="text-xl font-semibold font-title">Exporter mes données</h2>
		<p class="text-surface-text-muted text-sm">
			Avant de supprimer votre compte, vous pouvez récupérer une copie des
			données collectées sur vous. Elle s'ouvre dans un nouvel onglet, pour
			que vous puissiez ensuite revenir ici et supprimer votre compte de
			manière définitive.
		</p>
		<Button
			:icon="ArrowDownTrayIcon"
			label="Exporter mes données"
			variant="secondary"
			size="medium"
			handler="@:/settings/privacy#export-data"
		/>
	</Box>
	<Box>
		<h2 class="text-xl font-semibold font-title">
			Procéder à la suppression
		</h2>
		<p
			v-if="session"
			class="flex justify-start items-center gap-2 text-danger"
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
		<p class="text-surface-text-muted text-sm">
			<b>Cette action est irréversible.</b> Toutes vos données seront
			supprimées de nos serveurs et vous ne pourrez plus accéder à votre
			compte. Si vous êtes sûr.e de vouloir continuer, cliquez sur le
			bouton ci-dessous pour procéder à la suppression de votre compte.
		</p>
		<Button
			label="Supprimer mon compte"
			variant="primary"
			size="medium"
			:handler="handleAccountDeletion"
		/>
	</Box>
</template>
