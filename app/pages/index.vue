<script setup lang="ts">
import Icon from "~/assets/icon.svg";

import Button from "~/components/Button.vue";

const { refresh, session } = useAuthSession();
const router = useRouter();

await refresh();

if (session.value) {
	router.push("/discover");
}

definePageMeta({
	title: "Ademyst: Démarrez votre aventure",
	description:
		"Démarrez votre aventure avec Ademyst, la nouvelle version de Beam, offrant une expérience utilisateur inégalée.",
	layout: "landing",
});

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
		class="_no_container bg-linear-to-tr from-primary to-secondary text-white h-screen p-6 md:p-12"
	>
		<section
			class="flex flex-col justify-center items-start gap-8 bg-linear-to-tr from-white/10 to-white/5 border-2 border-white/15 rounded-tl-[64px] rounded-br-[64px] rounded-bl-3xl rounded-tr-3xl h-full sm:items-center max-md:p-8"
		>
			<Icon class="max-sm:max-h-8 sm:h-16" />
			<h1 class="text-2xl font-bold font-title sm:text-center sm:text-4xl sm:max-w-xl">
				Bienvenue sur Ademyst
			</h1>
			<p class="text-lg sm:text-center sm:text-xl sm:max-w-xl">
				Découvrez Ademyst, la toute nouvelle version de Beam, conçue
				pour offrir une expérience inégalée.
			</p>
			<nav>
				<ul class="flex items-center gap-4">
					<li>
						<Button
							label="C'est parti !"
							size="large"
							variant="white"
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
		</section>
	</header>
</template>
