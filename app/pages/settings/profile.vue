<script setup lang="ts">
import Box from "~/components/base/Box.vue";
import Actions from "~/components/base/Actions.vue";

import Avatar from "~/components/profile/Avatar.vue";
import SocialIcon from "~/components/profile/SocialIcon.vue";

import {
	XMarkIcon,
	ChevronLeftIcon,
	KeyIcon,
	ShieldCheckIcon,
	CheckBadgeIcon,
} from "@heroicons/vue/24/outline";

const { session, refresh } = useAuthSession();
await refresh();

if (!session.value) {
	navigateTo("/auth/login");
}

definePageMeta({
	title: "Modifier votre profil | Ademyst",
	description: "Modifiez vos paramètres de compte et d'affichage.",
	middleware: ["auth"],
});

useHead({
	title: "Modifier votre profil | Ademyst",
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

const name = ref(session?.value?.profile.name || "");

const payload = ref({
	displayName: session?.value?.profile.displayName || "",
	pronouns: session?.value?.profile.pronouns || "",
	bio: session?.value?.profile.bio || "",
	location: session?.value?.profile.location || "",
	corporation: session?.value?.profile.corporation || "",
});

const avatarFile = ref<File | null>(null);

const updateProfile = async () => {
	if (!session.value) return;

	try {
		const response = await $fetch(
			`/api/v1/users/${session.value?.profile.name}/profile`,
			{
				method: "PUT",
				body: payload.value,
			},
		);

		if (response) {
			await refresh();
			alert("Profil mis à jour avec succès !");
		}
	} catch (error) {
		console.error("Erreur lors de la mise à jour du profil :", error);
		alert("Une erreur est survenue lors de la mise à jour du profil.");
	}
};

const updateName = async () => {
	if (!session.value) return;

	try {
		const response = await $fetch(
			`/api/v1/users/${session.value?.profile.name}/profile`,
			{
				method: "PUT",
				body: { name: name.value },
			},
		);

		if (response) {
			await refresh();
			alert("Nom d'utilisateur mis à jour avec succès !");
		}
	} catch (error) {
		console.error(
			"Erreur lors de la mise à jour du nom d'utilisateur :",
			error,
		);
		alert(
			"Une erreur est survenue lors de la mise à jour du nom d'utilisateur.",
		);
	}
};

const uploadAvatar = async () => {
	if (!session.value) return;
	if (!avatarFile.value) {
		alert("Veuillez sélectionner un fichier avant de télécharger.");
		return;
	}

	const formData = new FormData();
	formData.append("avatar", avatarFile.value);

	try {
		const response = await $fetch(
			`/api/v1/users/${session.value?.profile.name}/avatar`,
			{
				method: "POST",
				body: formData,
			},
		);

		if (response) {
			await refresh();
			alert("Avatar mis à jour avec succès !");
		}
	} catch (error) {
		console.error("Erreur lors de la mise à jour de l'avatar :", error);
		alert("Une erreur est survenue lors de la mise à jour de l'avatar.");
	}
};

const linkPayload = ref("");

const addLink = async () => {
	if (!session.value) return;

	try {
		const response = await $fetch(
			`/api/v1/users/${session.value?.profile.name}/links`,
			{
				method: "POST",
				body: JSON.stringify(linkPayload.value),
			},
		);

		if (response) {
			await refresh();
			linkPayload.value = "";
			alert("Lien ajouté avec succès !");
		}
	} catch (error) {
		console.error("Erreur lors de l'ajout du lien :", error);
		alert("Une erreur est survenue lors de l'ajout du lien.");
	}
};

const removeLink = async (linkId: string) => {
	if (!session.value) return;

	try {
		const response = await $fetch(
			`/api/v1/users/${session.value?.profile.name}/links/${linkId}`,
			{
				method: "DELETE",
			},
		);

		if (response) {
			await refresh();
			alert("Lien supprimé avec succès !");
		}
	} catch (error) {
		console.error("Erreur lors de la suppression du lien :", error);
		alert("Une erreur est survenue lors de la suppression du lien.");
	}
};

const updateLink = async (linkId: string, updatedLink: any) => {
	if (!session.value) return;

	try {
		const response = await $fetch(
			`/api/v1/users/${session.value?.profile.name}/links/${linkId}`,
			{
				method: "PUT",
				body: updatedLink,
			},
		);

		if (response) {
			await refresh();
			alert("Lien mis à jour avec succès !");
		}
	} catch (error) {
		console.error("Erreur lors de la mise à jour du lien :", error);
		alert("Une erreur est survenue lors de la mise à jour du lien.");
	}
};

const isNameDialogOpen = ref(false);
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
				Modifier votre profil
			</h1>
		</nav>
	</Teleport>

	<section class="flex flex-col gap-4">
		<Avatar
			:size="192"
			:src="`/api/v1/users/${session?.profile.name}/avatar.webp`"
			class="mx-auto"
		/>
		<Input
			v-model="avatarFile"
			type="file"
			label="Changer d'avatar"
			accept="image/*"
			@change="uploadAvatar"
			class="mx-auto"
		/>
	</section>
	<section class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<Input
			v-model="name"
			label="Nom d'utilisateur"
			placeholder="Nom d'utilisateur"
			@enter="isNameDialogOpen = true"
			class="md:col-span-2"
		/>
		<p class="text-sm text-muted md:col-span-2">
			Le nom d'utilisateur est unique et sera utilisé pour accéder à votre
			profil. Une fois modifié, il est possible que votre ancien nom
			d'utilisateur soit pris par un autre utilisateur. Aucune redirection
			ne sera faite vers votre nouveau profil. Les mentions existantes
			pointeront vers un profil inexistant, ou vers le profil qui portera
			ce nom à son tour s'il en existe un.
		</p>
		<Input
			v-model="payload.displayName"
			label="Nom d'affichage"
			placeholder="Nom d'affichage"
			@enter="updateProfile"
		/>
		<Input
			v-model="payload.pronouns"
			label="Pronoms"
			placeholder="Pronoms"
			@enter="updateProfile"
		/>
		<Input
			v-model="payload.location"
			label="Localisation"
			placeholder="Localisation"
			@enter="updateProfile"
		/>
		<Input
			v-model="payload.corporation"
			label="Entreprise / Organisation"
			placeholder="Ademyst Co."
			@enter="updateProfile"
		/>
		<Input
			class="md:col-span-2"
			type="textarea"
			v-model="payload.bio"
			label="Bio"
			placeholder="Bio"
			@enter="updateProfile"
		/>
	</section>
	<section class="flex justify-center gap-2">
		<Button
			label="Sauvegarder"
			variant="primary"
			:handler="updateProfile"
		/>
	</section>
	<section class="flex flex-col gap-2">
		<h2 class="text-xl font-semibold font-title px-8">Liens</h2>
		<div class="flex flex-col gap-2">
			<Box scale="sm" layout="vertical-divide">
				<div
					v-for="link in session?.profile.links"
					class="flex items-center gap-2 p-4 sm:p-6 hover:bg-surface-hover transition-colors duration-200"
					:key="`link-${link.id}`"
				>
					<SocialIcon :icon="link.type" class="w-6 h-6" />
					<p class="grow text-lg font-medium">
						{{ link.resourceName || link.name || link.url }}
					</p>
					<XMarkIcon
						class="cursor-pointer text-surface-text-muted h-5 w-5"
						@click="removeLink(link.id)"
					/>
				</div>
				<p
					v-if="
						!session?.profile.links ||
						session?.profile.links.length === 0
					"
					class="text-surface-text-muted px-8"
				>
					Aucun lien ajouté.
				</p>
				<div class="flex gap-2 p-4 max-sm:flex-col sm:items-end sm:p-6">
					<Input
						v-model="linkPayload"
						label="URL du lien"
						placeholder="URL du lien"
						class="max-sm:w-full sm:grow"
					/>
					<Button
						label="Ajouter"
						:handler="addLink"
						class="w-80 h-fit"
					/>
				</div>
			</Box>
		</div>
	</section>
	<section class="flex flex-col gap-2">
		<h2 class="text-xl font-semibold font-title px-8">Vous cherchiez peut-être...</h2>
		<Actions
			scale="sm"
			:actions="[
				{
					label: 'Badges et certifications',
					icon: CheckBadgeIcon,
					handler: '/settings/badges',
				},
				{
					label: 'Compte et accès',
					icon: KeyIcon,
					handler: '/settings/account',
				},
				{
					label: 'Confidentialité',
					icon: ShieldCheckIcon,
					handler: '/settings/privacy',
				},
			]"
		/>
	</section>

	<Dialog
		v-if="isNameDialogOpen"
		@close="isNameDialogOpen = false"
		title="Modifier le nom de profil"
		description="Le lien permettant d'accéder à votre profil sera modifié. Attention: votre ancien nom sera libre aussitôt qu'il sera modifié. L'ancien lien vers votre profil et les mentions existantes pointeront vers un profil inexistant, ou vers le profil qui portera ce nom à son tour."
		:actions="[
			{
				label: 'Annuler',
				variant: 'link',
				handler: () => {
					isNameDialogOpen = false;
				},
			},
			{
				label: 'Mettre à jour',
				variant: 'primary',
				handler: updateName,
			},
		]"
	/>
</template>
