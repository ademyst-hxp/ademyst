<script setup lang="ts">
import {
	ShieldCheckIcon,
	EnvelopeIcon,
	ServerStackIcon,
	LockClosedIcon,
} from "@heroicons/vue/24/outline";

definePageMeta({
	title: "Ademyst: Confidentialité",
	description:
		"Politique de confidentialité et protection des données personnelles d'Ademyst.",
	layout: "blog",
});

useHead({
	title: "Ademyst: Confidentialité",
	meta: [
		{
			name: "description",
			content:
				"Politique de confidentialité et protection des données personnelles d'Ademyst.",
		},
		{
			name: "keywords",
			content:
				"Ademyst, confidentialité, RGPD, données personnelles, privacy",
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
		<h1 class="text-3xl font-bold text-center">Confidentialité</h1>
	</Teleport>

	<header
		class="flex flex-col gap-3 rounded-3xl bg-surface border border-surface-border p-6 md:p-8"
	>
		<div class="flex items-center gap-3 text-secondary">
			<ShieldCheckIcon class="w-7 h-7" />
			<span class="font-semibold">Ademyst</span>
		</div>

		<h2 class="text-3xl font-bold">Politique de confidentialité</h2>

		<p class="text-muted">Dernière mise à jour : 17 septembre 2026</p>
	</header>

	<article
		class="rounded-3xl bg-surface border border-surface-border p-6 md:p-8"
	>
		<div class="prose prose-surface max-w-none post-content -mx-2 md:-mx-4">
			<h2>1. Responsable du traitement</h2>

			<p>
				Le responsable du traitement des données personnelles dans le
				cadre d'Ademyst est :
			</p>

			<div
				class="not-prose rounded-2xl bg-surface-muted border border-surface-border p-5"
			>
				<p class="font-bold">Loan JEAN</p>
				<div>
					<p class="text-muted">contact@ejnalo.me</p>
				</div>
			</div>

			<h2>2. Données collectées</h2>

			<h3>Informations de compte</h3>

			<ul>
				<li>adresse e-mail ;</li>
				<li>nom d'utilisateur ;</li>
				<li>photo de profil, lorsqu'elle est fournie ;</li>
				<li>informations civiles fournies par l'utilisateur ;</li>
				<li>localisation, lorsqu'elle est fournie.</li>
			</ul>

			<h3>Contenus</h3>

			<ul>
				<li>publications ;</li>
				<li>réponses ;</li>
				<li>images et autres médias ;</li>
				<li>liens ;</li>
				<li>interactions ;</li>
				<li>signalements.</li>
			</ul>

			<h3>Données techniques</h3>

			<ul>
				<li>adresse IP ;</li>
				<li>informations relatives au navigateur ;</li>
				<li>informations relatives à l'appareil ;</li>
				<li>dates et heures de connexion ;</li>
				<li>journaux techniques ;</li>
				<li>informations relatives aux erreurs.</li>
			</ul>

			<h2>3. Utilisation des données</h2>

			<p>Les données peuvent notamment être utilisées pour :</p>

			<ul>
				<li>faire fonctionner Ademyst ;</li>
				<li>gérer les comptes utilisateurs ;</li>
				<li>afficher les publications ;</li>
				<li>permettre les interactions ;</li>
				<li>assurer la sécurité du service ;</li>
				<li>prévenir les abus et les fraudes ;</li>
				<li>assurer la modération ;</li>
				<li>traiter les signalements ;</li>
				<li>diagnostiquer les problèmes techniques ;</li>
				<li>respecter nos obligations légales.</li>
			</ul>

			<div
				class="not-prose flex gap-3 rounded-2xl bg-violet-50 border border-violet-100 p-5 text-violet-950"
			>
				<LockClosedIcon class="w-6 h-6 shrink-0" />

				<p>
					Ademyst n'a pas pour modèle économique la vente des données
					personnelles de ses utilisateurs.
				</p>
			</div>

			<h2>4. Bases légales</h2>

			<p>
				Selon le traitement concerné, Ademyst peut traiter les données
				sur la base :
			</p>

			<ul>
				<li>
					de l'exécution du contrat permettant l'utilisation du
					service ;
				</li>
				<li>
					de notre intérêt légitime, notamment pour la sécurité et la
					prévention des abus ;
				</li>
				<li>du respect d'une obligation légale ;</li>
				<li>du consentement lorsque celui-ci est requis.</li>
			</ul>

			<h2>5. Prestataires techniques</h2>

			<h3>Cloudflare</h3>

			<p>
				Ademyst utilise Cloudflare Pages pour l'hébergement et la
				distribution de son interface web.
			</p>

			<p>
				Certaines données techniques liées aux requêtes peuvent être
				traitées par Cloudflare dans le cadre de la fourniture et de la
				sécurisation de ses services.
			</p>

			<h3>Supabase</h3>

			<p>Ademyst utilise Supabase pour son infrastructure de données.</p>

			<ul>
				<li>PostgreSQL est utilisé pour la base de données ;</li>
				<li>
					Supabase Storage est utilisé pour le stockage des fichiers
					et médias.
				</li>
			</ul>

			<p>Ademyst n'utilise pas actuellement Supabase Auth.</p>

			<div
				class="not-prose flex flex-col gap-2 rounded-2xl bg-surface-muted border border-surface-border px-6 py-4"
			>
				<div class="flex items-center gap-2">
					<ServerStackIcon class="w-6 h-6 text-violet-500" />
					<span class="font-semibold"> Région Supabase </span>
				</div>

				<p class="text-muted m-0!">West EU (Paris) — eu-west-3</p>
			</div>

			<h2>6. Transferts de données</h2>

			<p>
				Ademyst privilégie, lorsque cela est possible, l'utilisation
				d'infrastructures situées dans l'Espace économique européen.
			</p>

			<p>
				Certains prestataires techniques peuvent néanmoins effectuer
				certains traitements ou faire appel à des sous-traitants situés
				en dehors de l'Espace économique européen.
			</p>

			<p>
				Les mécanismes prévus par la réglementation applicable sont
				utilisés lorsque des transferts internationaux sont nécessaires.
			</p>

			<h2>7. Contenus publics</h2>

			<p>
				Ademyst étant un réseau social, les contenus que vous choisissez
				de publier publiquement peuvent être consultés par d'autres
				personnes.
			</p>

			<p>
				Nous vous recommandons de ne pas publier d'informations
				personnelles que vous ne souhaitez pas rendre publiques.
			</p>

			<h2>8. Conservation</h2>

			<p>
				Les données sont conservées pendant une durée proportionnée à
				leur finalité.
			</p>

			<ul>
				<li>
					les données nécessaires au compte sont conservées pendant
					son existence ;
				</li>
				<li>les contenus sont conservés jusqu'à leur suppression ;</li>
				<li>
					certaines données peuvent être conservées après suppression
					lorsqu'une obligation légale ou un intérêt légitime le
					justifie ;
				</li>
				<li>
					les journaux techniques sont conservés pendant une durée
					limitée nécessaire à la sécurité et au fonctionnement du
					service.
				</li>
			</ul>

			<h2>9. Suppression du compte</h2>

			<p>L'utilisateur peut demander la suppression de son compte.</p>

			<p>
				Les données qui ne doivent plus être conservées sont alors
				supprimées ou anonymisées, sous réserve des obligations légales
				et des nécessités de sécurité.
			</p>

			<h2>10. Sécurité</h2>

			<p>
				Ademyst met en œuvre des mesures techniques et
				organisationnelles destinées à protéger les données personnelles
				contre les accès, modifications, divulgations ou destructions
				non autorisés.
			</p>

			<h2>11. Cookies et traceurs</h2>

			<p>
				Ademyst cherche à limiter les cookies et traceurs au strict
				nécessaire.
			</p>

			<p>
				Les cookies nécessaires au fonctionnement du service peuvent
				être utilisés sans consentement lorsqu'ils entrent dans les
				exemptions prévues par la réglementation applicable.
			</p>

			<p>
				Si des traceurs nécessitant un consentement sont introduits
				ultérieurement, ils feront l'objet d'un mécanisme de
				consentement approprié.
			</p>

			<h2>12. Vos droits</h2>

			<p>
				Dans les conditions prévues par le RGPD, vous disposez notamment
				:
			</p>

			<ul>
				<li>d'un droit d'accès ;</li>
				<li>d'un droit de rectification ;</li>
				<li>d'un droit à l'effacement ;</li>
				<li>d'un droit à la limitation ;</li>
				<li>d'un droit d'opposition ;</li>
				<li>d'un droit à la portabilité ;</li>
				<li>
					du droit de retirer votre consentement lorsqu'un traitement
					repose sur celui-ci.
				</li>
			</ul>

			<p>
				Pour exercer vos droits :
				<strong>contact@ejnalo.me</strong>
			</p>

			<h2>13. Réclamation auprès de la CNIL</h2>

			<p>
				Vous pouvez adresser une réclamation à la Commission nationale
				de l'informatique et des libertés (CNIL).
			</p>

			<p>
				<strong>CNIL</strong><br />
				3 place de Fontenoy<br />
				75007 Paris<br />
				France
			</p>

			<h2>14. Modification de la politique</h2>

			<p>
				Cette politique peut être modifiée afin de tenir compte de
				l'évolution d'Ademyst, de son infrastructure ou de la
				réglementation applicable.
			</p>

			<h2>15. Contact</h2>

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
