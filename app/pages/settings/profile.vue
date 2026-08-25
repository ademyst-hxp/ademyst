<script setup lang="ts">
import Box from "~/components/base/Box.vue";

import Avatar from "~/components/profile/Avatar.vue";
import SocialIcon from "~/components/profile/SocialIcon.vue";

import {
	XMarkIcon,
	ChevronRightIcon,
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

const payload = ref({
	name: session?.value?.profile.name || "",
	displayName: session?.value?.profile.displayName || "",
	bio: session?.value?.profile.bio || "",
	location: session?.value?.profile.location || "",
	corporation: session?.value?.profile.corporation || "",
});

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
				<h1 class="text-2xl font-bold px-8">Modifier votre profil</h1>
			</header>
			<main class="flex flex-col gap-8 overflow-visible">
				<section class="flex flex-col gap-4">
					<div class="flex gap-8 max-md:flex-col">
						<div class="w-full sm:w-fit">
							<Avatar
								:size="192"
								:src="`/api/v1/users/${session?.profile.name}/avatar.webp`"
							/>
						</div>
						<div class="flex flex-col gap-4 w-full">
							<Input
								v-model="payload.name"
								label="Nom d'utilisateur"
								placeholder="Nom d'utilisateur"
								@enter="updateProfile"
							/>
							<Input
								v-model="payload.displayName"
								label="Nom d'affichage"
								placeholder="Nom d'affichage"
								@enter="updateProfile"
							/>
							<Input
								v-model="payload.location"
								label="Localisation"
								placeholder="Localisation"
								@enter="updateProfile"
							/>
						</div>
					</div>
					<div class="flex flex-col gap-4">
						<Input
							v-model="payload.corporation"
							label="Entreprise / Organisation"
							placeholder="Entreprise / Organisation"
							@enter="updateProfile"
						/>
						<Input
							type="textarea"
							v-model="payload.bio"
							label="Bio"
							placeholder="Bio"
							@enter="updateProfile"
						/>
					</div>
				</section>
				<section class="flex flex-col gap-4">
					<h2 class="text-xl font-semibold px-8">Liens</h2>
					<div class="flex flex-col gap-2">
						<Box
							v-for="link in session?.profile.links"
							scale="sm"
							layout="horizontal"
						>
							<div class="flex items-center gap-2 w-full">
								<SocialIcon :icon="link.type" class="w-6 h-6" />
								<p class="grow text-lg font-medium">
									{{
										link.resourceName ||
										link.name ||
										link.url
									}}
								</p>
								<XMarkIcon
									class="cursor-pointer text-surface-text-muted h-5 w-5"
									@click="removeLink(link.id)"
								/>
							</div>
						</Box>
						<p
							v-if="
								!session?.profile.links ||
								session?.profile.links.length === 0
							"
							class="text-surface-text-muted px-8"
						>
							Aucun lien ajouté.
						</p>
						<div class="flex items-center gap-2">
							<Box scale="sm" class="w-full">
								<div
									class="flex gap-2 max-sm:flex-col sm:items-end"
								>
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
					</div>
				</section>
				<section class="flex flex-col gap-4">
					<h2 class="text-xl font-semibold px-8">
						Vous cherchiez peut-être...
					</h2>
					<div class="flex flex-col gap-2">
						<Box
							v-if="(session?.profile.level ?? 0) >= 4"
							scale="sm"
							layout="horizontal"
							class="items-center w-full cursor-pointer hover:scale-101 duration-200 transition-transform"
							:customColor="session?.profile.badge?.color"
							@click="navigateTo('/settings/badges')"
						>
							<div class="flex items-center gap-2 w-full">
								<CheckBadgeIcon class="h-8 w-8" />
								<p class="grow text-lg font-medium">
									Certifications et badges
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
						<Box
							scale="sm"
							layout="horizontal"
							class="items-center w-full cursor-pointer hover:scale-101 duration-200 transition-transform"
							@click="navigateTo('/settings/privacy')"
						>
							<div class="flex items-center gap-2 w-full">
								<ShieldCheckIcon class="h-8 w-8" />
								<p class="grow text-lg font-medium">
									Confidentialité
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
</template>
