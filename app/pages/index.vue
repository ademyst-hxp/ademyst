<script setup lang="ts">
import { ArrowDownCircleIcon } from "@heroicons/vue/24/outline";
import Logo from "~/assets/logo.svg";

import Button from "~/components/Button.vue";

const { refresh, session } = useAuthSession();
const router = useRouter();

await refresh();

if (session.value) {
	router.push("/discover");
}

useHead({
	title: "Ademyst: Démarrez votre aventure",
	meta: [
		{
			name: "description",
			content:
				"Démarrez votre aventure avec Ademyst, la nouvelle version de Beam, offrant une expérience utilisateur inégalée.",
		},
		{
			name: "keywords",
			content:
				"Beam, Ademyst, nouvelle version, expérience utilisateur, démarrage, aventure",
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
	<header
		class="_no_container flex flex-col justify-center gap-8 bg-primary-dark text-white h-screen sm:items-center max-md:p-8"
	>
		<Logo class="max-sm:w-full max-sm:max-h-24 sm:h-24" />
		<p class="text-xl sm:text-center sm:max-w-xl">
			Découvrez Ademyst, la toute nouvelle version de Beam, conçue pour
			offrir une expérience inégalée.
		</p>
		<nav>
			<ul class="flex items-center gap-4">
				<li>
					<Button
						label="C'est parti !"
						size="large"
						handler="/auth/login"
					/>
				</li>
				<li>
					<RouterLink
						to="/auth/signup"
						class="text-lg text-inherit/75 hover:underline"
					>
						S'inscrire
					</RouterLink>
				</li>
			</ul>
		</nav>
		<p class="justify-self-end italic max-w-xl sm:text-center">
			Aucune IA n'a été maltraitée durant la création de ce site.
		</p>
	</header>
</template>
