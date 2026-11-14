<script setup lang="ts">
import {
	EnvelopeIcon,
	LockClosedIcon,
	ServerStackIcon,
	ShieldCheckIcon,
	TrashIcon,
} from "@heroicons/vue/24/outline";

import Table from "~/components/base/Table.vue";

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

type Retention = {
	data: string;
	duration: string;
	start: string;
};

const retentions: Retention[] = [
	{
		data: "Whispers et réactions aux whispers",
		duration: "24 heures",
		start: "leur création",
	},
	{ data: "Notifications", duration: "1 an", start: "leur création" },
	{
		data: "Demandes (notamment d'abonnement)",
		duration: "1 an",
		start: "leur création",
	},
	{
		data: "Jetons de suppression de compte",
		duration: "1 an",
		start: "leur création",
	},
	{
		data: "Jetons et historique de modification de compte",
		duration: "1 an",
		start: "leur création",
	},
	{
		data: "Jetons de changement d'adresse e-mail",
		duration: "1 an",
		start: "leur création",
	},
	{
		data: "Jetons de confirmation d'adresse e-mail",
		duration: "1 an",
		start: "leur création",
	},
	{
		data: "Sessions de connexion",
		duration: "1 an",
		start: "la dernière activité de la session",
	},
	{ data: "Exports de données", duration: "3 ans", start: "leur création" },
	{
		data: "Codes de parrainage (et parrainages associés)",
		duration: "3 ans",
		start: "leur création",
	},
	{
		data: "Visites de publications (vues uniques)",
		duration: "3 ans",
		start: "la dernière visite",
	},
	{
		data: "Signalements de publications",
		duration: "5 ans",
		start: "leur dernière mise à jour",
	},
	{
		data: "Signalements de profils",
		duration: "5 ans",
		start: "leur dernière mise à jour",
	},
	{
		data: "Signalements de whispers",
		duration: "5 ans",
		start: "leur dernière mise à jour",
	},
	{ data: "Sanctions", duration: "5 ans", start: "leur expiration" },
];
</script>

<template>
	<Teleport to="#header">
		<h1 class="text-3xl font-bold text-center font-title">
			Confidentialité
		</h1>
	</Teleport>

	<header
		class="flex flex-col gap-3 rounded-3xl bg-surface border border-surface-border p-6 md:p-8"
	>
		<div class="flex items-center gap-3 text-secondary">
			<ShieldCheckIcon class="w-7 h-7" />
			<span class="font-semibold">Ademyst</span>
		</div>

		<h2 class="text-3xl font-bold font-title">
			Politique de confidentialité
		</h2>

		<p class="text-muted">Dernière mise à jour: 14 novembre 2026</p>
		<p class="text-muted">Entrée en vigueur: 16 novembre 2026</p>
	</header>

	<article
		class="rounded-3xl bg-surface border border-surface-border p-6 md:p-8"
	>
		<div class="prose prose-surface max-w-none post-content -mx-2 md:-mx-4">
			<h2 class="font-title">1. Responsable du traitement</h2>

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

			<h2 class="font-title">2. Données collectées</h2>

			<h3 class="font-title">Informations de compte</h3>

			<ul class="list-disc list-inside">
				<li>adresse e-mail ;</li>
				<li>nom d'utilisateur ;</li>
				<li>photo de profil, lorsqu'elle est fournie ;</li>
				<li>
					informations civiles et géographiques renseignées par
					l'utilisateur ;
				</li>
				<li>sessions de connexion ;</li>
				<li>codes de parrainage et parrainages ;</li>
				<li>demandes, notamment d'abonnement ;</li>
				<li>notifications ;</li>
				<li>sanctions de modération.</li>
			</ul>

			<h3 class="font-title">Contenus</h3>

			<ul class="list-disc list-inside">
				<li>publications ;</li>
				<li>réponses ;</li>
				<li>
					whispers (contenus éphémères) et réactions à ces whispers ;
				</li>
				<li>images et autres médias ;</li>
				<li>liens ;</li>
				<li>interactions ;</li>
				<li>signalements.</li>
			</ul>

			<h3 class="font-title">Statistiques de consultation</h3>

			<ul class="list-disc list-inside">
				<li>
					les consultations de publications, enregistrées afin de
					comptabiliser des vues uniques (un même utilisateur n'est
					compté qu'une fois par publication), avec la date de sa
					dernière visite.
				</li>
			</ul>

			<h3 class="font-title">Données techniques</h3>

			<ul class="list-disc list-inside">
				<li>adresse IP ;</li>
				<li>informations relatives au navigateur ;</li>
				<li>informations relatives à l'appareil ;</li>
				<li>dates et heures de connexion ;</li>
				<li>journaux techniques ;</li>
				<li>informations relatives aux erreurs.</li>
			</ul>

			<h2 class="font-title">3. Utilisation des données</h2>

			<p>Les données peuvent notamment être utilisées pour :</p>

			<ul class="list-disc list-inside">
				<li>faire fonctionner Ademyst ;</li>
				<li>gérer les comptes utilisateurs ;</li>
				<li>afficher les publications ;</li>
				<li>permettre les interactions ;</li>
				<li>
					produire des statistiques de vues uniques des publications ;
				</li>
				<li>assurer la sécurité du service ;</li>
				<li>prévenir les abus et les fraudes ;</li>
				<li>assurer la modération ;</li>
				<li>traiter les signalements ;</li>
				<li>diagnostiquer les problèmes techniques ;</li>
				<li>respecter nos obligations légales.</li>
			</ul>

			<p>
				Les données de consultation ne sont utilisées qu'à des fins
				statistiques, pour indiquer combien de personnes ont consulté
				une publication. Elles ne servent pas à du ciblage publicitaire.
			</p>

			<div
				class="not-prose flex items-center gap-3 rounded-2xl bg-violet-50 border border-violet-100 p-5 text-violet-950"
			>
				<LockClosedIcon class="w-6 h-6 shrink-0" />

				<p>
					Ademyst n'a pas pour modèle économique la vente des données
					personnelles de ses utilisateurs.
				</p>
			</div>

			<h2 class="font-title">4. Bases légales</h2>

			<p>
				Selon le traitement concerné, Ademyst peut traiter les données
				sur la base :
			</p>

			<ul class="list-disc list-inside">
				<li>
					de l'exécution du contrat permettant l'utilisation du
					service ;
				</li>
				<li>
					de notre intérêt légitime, notamment pour la sécurité, la
					prévention des abus et la production de statistiques de
					consultation des publications ;
				</li>
				<li>du respect d'une obligation légale ;</li>
				<li>du consentement lorsque celui-ci est requis.</li>
			</ul>

			<h2 class="font-title">5. Prestataires techniques</h2>

			<h3 class="font-title">Cloudflare</h3>

			<p>
				Ademyst utilise Cloudflare Workers pour l'hébergement et la
				distribution de son interface web, ainsi que pour l'exécution de
				tâches automatisées, notamment la purge des données décrite à la
				section 8.
			</p>

			<p>
				Certaines données techniques liées aux requêtes peuvent être
				traitées par Cloudflare dans le cadre de la fourniture et de la
				sécurisation de ses services.
			</p>

			<h3 class="font-title">Supabase</h3>

			<p>Ademyst utilise Supabase pour son infrastructure de données.</p>

			<ul class="list-disc list-inside">
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

				<p class="text-muted m-0!">West EU (Londres) — eu-west-2</p>
			</div>

			<h2 class="font-title">6. Transferts de données</h2>

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

			<h2 class="font-title">7. Contenus publics</h2>

			<p>
				Ademyst étant un réseau social, les contenus que vous choisissez
				de publier publiquement peuvent être consultés par d'autres
				personnes.
			</p>

			<p>
				Nous vous recommandons de ne pas publier d'informations
				personnelles que vous ne souhaitez pas rendre publiques.
			</p>

			<h2 class="font-title">8. Conservation et purge automatique</h2>

			<p>
				Les données sont conservées pendant une durée proportionnée à
				leur finalité.
			</p>

			<ul class="list-disc list-inside">
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

			<h3 class="font-title">Purge automatique</h3>

			<p>
				Pour certaines catégories de données, Ademyst applique une purge
				automatique : des tâches planifiées suppriment définitivement
				les données dont la durée de conservation est dépassée, sans
				action de votre part. Les whispers et leurs réactions sont
				purgés toutes les heures ; les autres données sont purgées une
				fois par jour. La suppression est donc effective peu après
				l'échéance, et non à la seconde près.
			</p>

			<div
				class="not-prose flex items-center gap-3 rounded-2xl bg-violet-50 border border-violet-100 p-5 text-violet-950"
			>
				<TrashIcon class="w-6 h-6 shrink-0" />

				<p>
					Les données purgées sont supprimées de façon irréversible et
					ne peuvent plus être restaurées.
				</p>
			</div>

			<Table>
				<template #head>
					<tr>
						<th class="px-4 py-3 font-semibold">Données</th>
						<th class="px-4 py-3 font-semibold">Durée</th>
						<th class="px-4 py-3 font-semibold">À compter de</th>
					</tr>
				</template>
				<template #body>
					<tr
						v-for="row in retentions"
						:key="row.data"
					>
						<th class="px-4 py-3">{{ row.data }}</th>
						<td class="px-4 py-3 whitespace-nowrap">
							{{ row.duration }}
						</td>
						<td class="px-4 py-3">{{ row.start }}</td>
					</tr>
				</template>
			</Table>

			<p>Précisions :</p>

			<ul class="list-disc list-inside">
				<li>
					les whispers étant supprimés au bout de 24 heures, un
					signalement de whisper conservé au-delà ne contient plus le
					contenu du whisper signalé ;
				</li>
				<li>
					les sanctions sans date d'expiration (par exemple un
					avertissement ou un bannissement définitif) ne sont pas
					purgées automatiquement ;
				</li>
				<li>
					les durées de conservation des signalements et des sanctions
					répondent à des besoins de modération, de sécurité et de
					prévention des abus ;
				</li>
				<li>
					les autres données sont conservées selon les règles
					générales ci-dessus.
				</li>
			</ul>

			<h2 class="font-title">9. Suppression du compte</h2>

			<p>L'utilisateur peut demander la suppression de son compte.</p>

			<p>
				Les données qui ne doivent plus être conservées sont alors
				supprimées ou anonymisées, sous réserve des obligations légales
				et des nécessités de sécurité.
			</p>

			<h2 class="font-title">10. Sécurité</h2>

			<p>
				Ademyst met en œuvre des mesures techniques et
				organisationnelles destinées à protéger les données personnelles
				contre les accès, modifications, divulgations ou destructions
				non autorisés.
			</p>

			<h2 class="font-title">11. Cookies et traceurs</h2>

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

			<h2 class="font-title">12. Vos droits</h2>

			<p>
				Dans les conditions prévues par le RGPD, vous disposez notamment
				:
			</p>

			<ul class="list-disc list-inside">
				<li>d'un droit d'accès ;</li>
				<li>d'un droit de rectification ;</li>
				<li>d'un droit à l'effacement ;</li>
				<li>d'un droit à la limitation ;</li>
				<li>
					d'un droit d'opposition, y compris aux traitements fondés
					sur notre intérêt légitime, comme les statistiques de
					consultation ;
				</li>
				<li>d'un droit à la portabilité ;</li>
				<li>
					du droit de retirer votre consentement lorsqu'un traitement
					repose sur celui-ci.
				</li>
			</ul>

			<p>
				Vous pouvez télécharger une copie de vos données en allant dans
				vos
				<RouterLink
					to="/settings/privacy"
					class="text-primary hover:underline"
					>paramètres de confidentialité</RouterLink
				>, rubrique "Exporter mes données".
			</p>

			<p>
				Pour exercer vos droits :
				<strong>contact@ejnalo.me</strong>
			</p>

			<h2 class="font-title">13. Réclamation auprès de la CNIL</h2>

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

			<h2 class="font-title">14. Modification de la politique</h2>

			<p>
				Cette politique peut être modifiée afin de tenir compte de
				l'évolution d'Ademyst, de son infrastructure ou de la
				réglementation applicable.
			</p>

			<h2 class="font-title">15. Contact</h2>

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
