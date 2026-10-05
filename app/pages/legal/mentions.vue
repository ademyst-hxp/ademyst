<script setup lang="ts">
import {
	BuildingOffice2Icon,
	EnvelopeIcon,
} from "@heroicons/vue/24/outline";

definePageMeta({
	title: "Ademyst: Mentions légales",
	description: "Mentions légales de la plateforme Ademyst.",
	layout: "blog",
});

useHead({
	title: "Ademyst: Mentions légales",
	meta: [
		{
			name: "description",
			content: "Mentions légales de la plateforme Ademyst.",
		},
		{
			name: "keywords",
			content: "Ademyst, mentions légales, éditeur, hébergement",
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
		<h1 class="text-3xl font-bold text-center font-title">Mentions légales</h1>
	</Teleport>

	<header
		class="flex flex-col gap-3 rounded-3xl bg-surface border border-surface-border p-6 md:p-8"
	>
		<div class="flex items-center gap-3 text-orange-500">
			<BuildingOffice2Icon class="w-7 h-7" />
			<span class="font-semibold">Ademyst</span>
		</div>

		<h2 class="text-3xl font-bold font-title">Mentions légales</h2>

		<p class="text-muted">Dernière mise à jour : 17 septembre 2026</p>
	</header>

	<article
		class="rounded-3xl bg-surface border border-surface-border p-6 md:p-8"
	>
		<div class="prose prose-surface max-w-none post-content -mx-2 md:-mx-4">
			<h2 class="font-title">1. Éditeur</h2>

			<p>Le site et la plateforme Ademyst sont édités par :</p>

			<div
				class="not-prose rounded-2xl bg-surface border border-surface-border px-6 py-4"
			>
				<p class="font-bold text-lg">Loan JEAN</p>
				<div>
					<p class="text-muted">Éditeur personne physique</p>
					<p class="text-muted">E-mail: contact@ejnalo.me</p>
				</div>
			</div>

			<h2 class="font-title">2. Directeur de la publication</h2>

			<p>
				<strong>Loan JEAN</strong>
			</p>

			<h2 class="font-title">3. Hébergement et infrastructure</h2>

			<h3 class="font-title">Cloudflare</h3>

			<p>
				Ademyst utilise Cloudflare Pages pour l'hébergement et la
				distribution de son interface web.
			</p>

			<p>
				<strong>Cloudflare, Inc.</strong><br />
				101 Townsend Street<br />
				San Francisco, CA 94107<br />
				États-Unis
			</p>

			<h3 class="font-title">Supabase</h3>

			<p>
				Ademyst utilise Supabase pour sa base de données PostgreSQL et
				son stockage de fichiers via Supabase Storage.
			</p>

			<p>
				<strong>Supabase, Inc.</strong>
			</p>

			<h2 class="font-title">4. Propriété intellectuelle</h2>

			<p>
				Le nom « Ademyst », son identité visuelle, son logo, ses
				interfaces, son code, ses textes et les éléments graphiques
				propres à la plateforme sont protégés par les dispositions
				applicables en matière de propriété intellectuelle.
			</p>

			<p>
				Les contenus publiés par les utilisateurs restent la propriété
				de leurs auteurs ou de leurs titulaires de droits, sous réserve
				des droits accordés à Ademyst dans les Conditions Générales
				d'Utilisation.
			</p>

			<h2 class="font-title">5. Contenus publiés par les utilisateurs</h2>

			<p>Ademyst permet à ses utilisateurs de publier des contenus.</p>

			<p>
				Chaque utilisateur demeure responsable des contenus qu'il
				publie.
			</p>

			<h2 class="font-title">6. Données personnelles</h2>

			<p>
				Les traitements de données personnelles effectués dans le cadre
				d'Ademyst sont décrits dans la
				<a
					href="/legal/privacy"
					class="text-secondary hover:underline"
				>
					Politique de confidentialité </a
				>.
			</p>

			<h2 class="font-title">7. Conditions d'utilisation</h2>

			<p>
				Les règles applicables à l'utilisation de la plateforme sont
				disponibles dans les
				<a href="/legal/terms" class="text-primary hover:underline">
					Conditions Générales d'Utilisation </a
				>.
			</p>

			<h2 class="font-title">8. Cookies et traceurs</h2>

			<p>
				Ademyst peut utiliser des cookies et autres traceurs nécessaires
				au fonctionnement du service.
			</p>

			<p>
				Les informations relatives à ces technologies sont détaillées
				dans la Politique de confidentialité.
			</p>

			<h2 class="font-title">9. Responsabilité</h2>

			<p>
				Ademyst met en œuvre des moyens raisonnables afin de maintenir
				un service fiable et sécurisé.
			</p>

			<p>
				Ademyst ne saurait toutefois garantir l'exactitude ou
				l'exhaustivité de l'ensemble des contenus publiés par les
				utilisateurs.
			</p>

			<p>
				Les contenus publiés par les utilisateurs n'engagent pas
				nécessairement Ademyst.
			</p>

			<h2 class="font-title">10. Droit applicable</h2>

			<p>
				Les présentes mentions légales sont soumises au droit français,
				sous réserve des dispositions impératives applicables.
			</p>

			<h2 class="font-title">11. Contact</h2>

			<div
				class="not-prose flex items-center gap-3 rounded-2xl bg-surface border border-surface-border px-6 py-4"
			>
				<EnvelopeIcon class="w-6 h-6 text-primary" />

				<div class="-space-y-1 m-0!">
					<span class="block font-semibold">Loan JEAN</span>
					<span class="block text-muted">contact@ejnalo.me</span>
				</div>
			</div>
		</div>
	</article>
</template>
