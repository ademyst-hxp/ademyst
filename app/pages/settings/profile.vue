<script setup lang="ts">
import {
	CheckBadgeIcon,
	ChevronLeftIcon,
	KeyIcon,
	ShieldCheckIcon,
	XMarkIcon,
} from "@heroicons/vue/24/outline";
import SocialIcon from "~/components/profile/SocialIcon.vue";

import Actions from "~/components/base/Actions.vue";
import Box from "~/components/base/Box.vue";
import Popup from "~/components/base/Popup.vue";

import Avatar from "~/components/profile/Avatar.vue";
import ProfileBox from "~/components/profile/ProfileBox.vue";

import type { Profile } from "~~/shared/models/profiles";

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

const _profile = ref(session?.value?.profile || ({} as Profile));

const payload = computed(() => ({
	displayName:
		_profile.value.displayName || session?.value?.profile.displayName || "",
	pronouns: _profile.value.pronouns || session?.value?.profile.pronouns || "",
	bio: _profile.value.bio || session?.value?.profile.bio || "",
	location: _profile.value.location || session?.value?.profile.location || "",
	corporation:
		_profile.value.corporation || session?.value?.profile.corporation || "",
}));

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

const previewAvatar = computed(() => {
	if (avatarFile.value) {
		return URL.createObjectURL(avatarFile.value);
	}

	return `/api/v1/users/${session?.value?.profile.name}/avatar.webp`;
});

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

const isNameConfirmationOpen = ref(false);
const isNameMenuOpen = ref(false);
const isAvatarMenuOpen = ref(false);
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
	<section class="flex flex-col gap-2">
		<div class="flex gap-4 max-md:flex-col max-md:items-center">
			<ProfileBox
				v-model="_profile"
				editable
				class="w-1/2 max-md:hidden"
			/>
			<ProfileBox
				v-model="_profile"
				editable
				layout="horizontal"
				class="md:hidden"
			/>
			<div class="grow flex flex-col justify-center gap-4 w-full">
				<div class="flex items-center gap-2">
					<Input
						v-model="name"
						placeholder="Nom d'utilisateur"
						class="grow"
						disabled
					/>
					<Button
						label="Modifier"
						variant="white"
						:handler="
							() => {
								isNameMenuOpen = true;
							}
						"
					/>
				</div>
				<hr class="border-surface-border rounded-full mx-16" />
				<Input
					v-model="payload.pronouns"
					label="Pronoms"
					placeholder="Pronoms"
					@enter="updateProfile"
				/>
				<div class="grid gap-2 sm:grid-cols-2">
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
				</div>
				<div class="flex items-center gap-2 max-sm:flex-col">
					<Button
						label="Changer d'avatar"
						variant="white"
						:handler="() => (isAvatarMenuOpen = true)"
					/>
					<Button
						label="Sauvegarder"
						variant="primary"
						:handler="updateProfile"
					/>
				</div>
			</div>
		</div>
	</section>
	<section class="flex flex-col gap-2">
		<Input
			class="min-h-48 md:min-h-64"
			type="textarea"
			v-model="payload.bio"
			label="Bio"
			placeholder="Bio"
			@enter="updateProfile"
		/>
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
		<h2 class="text-xl font-semibold font-title px-8">
			Vous cherchiez peut-être...
		</h2>
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

	<Popup v-if="isNameMenuOpen" @close="isNameMenuOpen = false">
		<Box class="items-center justify-center w-full sm:w-lg">
			<Input
				v-model="name"
				label="Nom d'utilisateur"
				placeholder="Nom d'utilisateur"
				@enter="
					() => {
						isNameMenuOpen = false;
						isNameConfirmationOpen = true;
					}
				"
				class="w-full"
			/>
			<p class="text-sm text-muted">
				Le nom d'utilisateur est unique et sera utilisé pour accéder à
				votre profil.
			</p>
			<p class="text-sm text-muted">
				Une fois modifié, il est possible que votre ancien nom
				d'utilisateur soit pris par un autre utilisateur. Les mentions
				existantes pointeront vers un profil inexistant, ou vers le
				profil qui portera ce nom à son tour s'il en existe un.
			</p>
			<Button
				label="Mettre à jour"
				variant="primary"
				:handler="
					() => {
						isNameMenuOpen = false;
						isNameConfirmationOpen = true;
					}
				"
			/>
			<Button
				label="Annuler"
				variant="link"
				:handler="() => (isNameMenuOpen = false)"
			/>
		</Box>
	</Popup>

	<Dialog
		v-if="isNameConfirmationOpen"
		@close="isNameConfirmationOpen = false"
		title="Modifier le nom de profil"
		description="Le lien permettant d'accéder à votre profil sera modifié. Attention: votre ancien nom sera libre aussitôt qu'il sera modifié. L'ancien lien vers votre profil et les mentions existantes pointeront vers un profil inexistant, ou vers le profil qui portera ce nom à son tour."
		:actions="[
			{
				label: 'Annuler',
				variant: 'link',
				handler: () => {
					isNameConfirmationOpen = false;
				},
			},
			{
				label: 'Mettre à jour',
				variant: 'primary',
				handler: updateName,
			},
		]"
	/>

	<Popup v-if="isAvatarMenuOpen" @close="isAvatarMenuOpen = false">
		<Box class="items-center justify-center w-full sm:w-lg">
			<Avatar :size="192" :src="previewAvatar" class="mx-auto" />
			<div class="flex flex-col w-full text-center">
				<p class="text-muted">Formats acceptés: PNG, JPEG, WEBP.</p>
				<p class="text-danger">Taille maximale: 1Mo</p>
			</div>
			<Input
				v-model="avatarFile"
				type="file"
				label="Changer d'avatar"
				accept="image/*"
				class="mx-auto"
			/>
			<div class="flex flex-col gap-2">
				<div class="flex h-32 gap-2">
					<img
						:src="previewAvatar"
						alt="Avatar actuel"
						class="h-full w-auto aspect-4/5 shrink-0 rounded-2xl border border-surface-border object-cover"
					/>
					<img
						:src="previewAvatar"
						alt="Avatar actuel"
						class="h-full w-auto aspect-square shrink-0 rounded-2xl border border-surface-border object-cover"
					/>
					<img
						:src="previewAvatar"
						alt="Avatar actuel"
						class="h-full w-auto aspect-5/4 shrink-0 rounded-2xl border border-surface-border object-cover max-sm:hidden"
					/>
				</div>
				<img
					:src="previewAvatar"
					alt="Avatar actuel"
					class="w-full aspect-5/4 shrink-0 rounded-2xl border border-surface-border object-cover sm:hidden"
				/>
			</div>
			<Button
				label="Mettre à jour"
				variant="primary"
				:handler="
					() => {
						isAvatarMenuOpen = false;
						uploadAvatar();
					}
				"
			/>
			<Button
				label="Annuler"
				variant="link"
				:handler="() => (isAvatarMenuOpen = false)"
			/>
		</Box>
	</Popup>
</template>
