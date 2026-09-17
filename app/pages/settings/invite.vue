<script setup lang="ts">
import Box from "~/components/base/Box.vue";
import Actions from "~/components/base/Actions.vue";

import { UsersIcon, ChevronLeftIcon } from "@heroicons/vue/24/outline";

import Info from "~/components/boxes/Info.vue";

const { session, refresh: refreshSession } = useAuthSession();
await refreshSession();

const { $api } = useNuxtApp();

if (!session.value) {
	navigateTo("/auth/login");
}

definePageMeta({
	title: "Faire parler d'Ademyst | Ademyst",
	description: "Modifiez vos paramètres de compte et d'affichage.",
	middleware: ["auth"],
});

useHead({
	title: "Faire parler d'Ademyst | Ademyst",
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
				Faire parler d'Ademyst
			</h1>
		</nav>
	</Teleport>

	<section class="flex flex-col gap-4">
		<h2 class="text-xl font-semibold">
			Cette page n'est pas encore disponible.
		</h2>
		<Info :icon="UsersIcon" title="Bientôt les liens de parainnages ;)">
			Pas de panique ! Tu peux quand même inviter tes amis à rejoindre
			Ademyst dès maintenant. Ils bénéficieront de quelques mois pour
			entrer ton compte de parrainage même si leur compte est déjà créé !
		</Info>
	</section>
</template>
