<script setup lang="ts">
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
	<header class="flex flex-col justify-center gap-8 h-screen md:items-center max-md:p-8">
		<h1 class="text-5xl font-bold">Ademyst</h1>
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
						class="text-lg text-muted hover:underline"
					>
						S'inscrire
					</RouterLink>
				</li>
			</ul>
		</nav>
	</header>
</template>
