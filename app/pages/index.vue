<script setup lang="ts">
import Button from "~/components/Button.vue";

const { refresh, session } = useAuthSession();
const router = useRouter();

await refresh();

if (session.value) {
	router.push("/discover");
}

useHead({
	title: "Beam: Revolved",
	meta: [
		{
			name: "description",
			content:
				"Démarrez votre aventure avec Revolved, la nouvelle version de Beam, offrant une expérience utilisateur inégalée.",
		},
		{
			name: "keywords",
			content:
				"Beam, Revolved, nouvelle version, expérience utilisateur, démarrage, aventure",
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
	<header class="flex flex-col justify-center items-center gap-8 h-screen">
		<h1 class="text-5xl font-bold">Beam: Revolved</h1>
		<p class="text-xl sm:text-center sm:max-w-xl">
			Découvrez Revolved, la toute nouvelle version de Beam, conçue pour
			offrir une expérience inégalée.
		</p>
		<nav>
			<ul class="flex gap-4">
				<li>
					<Button
						label="C'est parti !"
						size="large"
						handler="/auth/login"
					/>
				</li>
			</ul>
		</nav>
	</header>
</template>
