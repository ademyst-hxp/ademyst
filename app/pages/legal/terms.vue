<script setup lang="ts">
import {
	DocumentTextIcon,
	EnvelopeIcon,
	ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";

definePageMeta({
	title: "Ademyst: Conditions d'utilisation",
	description: "Conditions Générales d'Utilisation de la plateforme Ademyst.",
	layout: "blog",
});

useHead({
	title: "Ademyst: Conditions d'utilisation",
	meta: [
		{
			name: "description",
			content:
				"Conditions Générales d'Utilisation de la plateforme Ademyst.",
		},
		{
			name: "keywords",
			content: "Ademyst, CGU, conditions, utilisation",
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
		<h1 class="text-3xl font-bold text-center font-title">Conditions d'utilisation</h1>
	</Teleport>

	<section class="flex flex-col gap-6">
		<header
			class="flex flex-col gap-3 rounded-3xl bg-surface border border-surface-border p-6 md:p-8"
		>
			<div class="flex items-center gap-3 text-orange-500">
				<DocumentTextIcon class="w-7 h-7" />
				<span class="font-semibold">Ademyst</span>
			</div>

			<h2 class="text-3xl font-bold font-title">
				Conditions Générales d'Utilisation
			</h2>

			<p class="text-muted">Dernière mise à jour : 17 septembre 2026</p>
		</header>

		<article
			class="rounded-3xl bg-surface border border-surface-border p-6 md:p-10"
		>
			<div class="prose prose-surface max-w-none">
				<h2 class="font-title">1. Objet</h2>

				<p>
					Les présentes Conditions Générales d'Utilisation (ci-après «
					CGU ») encadrent l'accès et l'utilisation de la plateforme
					Ademyst.
				</p>

				<p>
					Ademyst est une plateforme sociale destinée à favoriser les
					échanges écrits, la discussion, la réflexion et le partage
					de connaissances.
				</p>

				<p>
					L'utilisation d'Ademyst implique l'acceptation des présentes
					CGU.
				</p>

				<h2 class="font-title">2. Accès à la plateforme</h2>

				<p>
					L'accès à certaines fonctionnalités d'Ademyst nécessite la
					création d'un compte.
				</p>

				<p>
					L'utilisateur s'engage à fournir des informations exactes et
					à ne pas utiliser la plateforme sous l'identité d'une autre
					personne.
				</p>

				<h2 class="font-title">3. Compte utilisateur</h2>

				<p>
					L'utilisateur est responsable de la confidentialité de ses
					identifiants ainsi que des activités réalisées depuis son
					compte.
				</p>

				<p>
					En cas d'utilisation non autorisée de son compte,
					l'utilisateur doit en informer Ademyst dans les meilleurs
					délais.
				</p>

				<h2 class="font-title">4. Publications</h2>

				<p>
					Les utilisateurs conservent leurs droits sur les contenus
					qu'ils publient.
				</p>

				<p>
					En publiant un contenu sur Ademyst, l'utilisateur accorde à
					Ademyst une licence non exclusive, mondiale et gratuite,
					limitée à ce qui est nécessaire au fonctionnement du
					service.
				</p>

				<p>
					Cette licence permet notamment à Ademyst de stocker,
					reproduire, adapter techniquement, représenter et distribuer
					le contenu dans le cadre de la plateforme.
				</p>

				<p>
					Ademyst ne devient pas propriétaire des contenus publiés par
					ses utilisateurs.
				</p>

				<h2 class="font-title">5. Responsabilité des utilisateurs</h2>

				<p>
					Chaque utilisateur demeure responsable des contenus qu'il
					publie et des conséquences de ceux-ci.
				</p>

				<div
					class="not-prose flex gap-3 rounded-2xl bg-orange-50 border border-orange-100 p-5 text-orange-950"
				>
					<ExclamationTriangleIcon class="w-6 h-6 shrink-0 mt-0.5" />

					<p>
						La publication d'un contenu sur Ademyst ne transfère pas
						la responsabilité juridique de ce contenu à Ademyst.
					</p>
				</div>

				<h2 class="font-title">6. Contenus interdits</h2>

				<p>Il est notamment interdit de publier des contenus :</p>

				<ul>
					<li>manifestement illicites ;</li>
					<li>
						constituant une menace ou une incitation à la violence ;
					</li>
					<li>
						portant atteinte aux droits ou à la vie privée d'autrui
						;
					</li>
					<li>
						constituant du harcèlement ou une campagne de
						persécution ;
					</li>
					<li>
						usurpant l'identité d'une personne ou d'une organisation
						;
					</li>
					<li>
						portant atteinte aux droits de propriété intellectuelle
						d'un tiers ;
					</li>
					<li>constituant une fraude ou une escroquerie ;</li>
					<li>
						constituant du spam ou une utilisation automatisée
						abusive ;
					</li>
					<li>violant les règles de la communauté d'Ademyst.</li>
				</ul>

				<h2 class="font-title">7. Intelligence artificielle</h2>

				<p>
					Ademyst s'oppose à l'utilisation de contenus générés par
					intelligence artificielle comme moyen de produire
					massivement du contenu destiné à alimenter artificiellement
					la plateforme.
				</p>

				<p>
					Ademyst peut limiter, signaler ou supprimer certains
					contenus ou comptes lorsque ceux-ci contreviennent aux
					règles applicables aux contenus générés ou automatisés.
				</p>

				<p>
					Les utilisateurs restent responsables des contenus qu'ils
					publient, y compris lorsqu'ils utilisent des outils
					d'intelligence artificielle.
				</p>

				<h2 class="font-title">8. Modération</h2>

				<p>
					Ademyst peut utiliser des mécanismes de modération humains
					et automatisés afin de garantir la sécurité de la plateforme
					et le respect des présentes CGU.
				</p>

				<p>Les mesures de modération peuvent notamment inclure :</p>

				<ul>
					<li>la suppression d'une publication ;</li>
					<li>la limitation de sa visibilité ;</li>
					<li>la restriction de certaines fonctionnalités ;</li>
					<li>la suspension temporaire d'un compte ;</li>
					<li>la suppression définitive d'un compte.</li>
				</ul>

				<h2 class="font-title">9. Signalement</h2>

				<p>
					Tout utilisateur peut signaler un contenu qu'il estime
					contraire aux présentes CGU ou à la législation applicable.
				</p>

				<p>
					Les modalités de signalement sont accessibles depuis la
					plateforme.
				</p>

				<h2 class="font-title">10. Contestation d'une décision</h2>

				<p>
					Lorsqu'une décision de modération affecte un utilisateur,
					celui-ci peut demander son réexamen lorsque la
					réglementation applicable le prévoit.
				</p>

				<p>
					Les modalités de contestation sont communiquées à
					l'utilisateur avec la décision concernée.
				</p>

				<h2 class="font-title">11. Propriété intellectuelle</h2>

				<p>
					Le nom « Ademyst », son identité visuelle, son logo, ses
					interfaces, son code et les éléments graphiques propres à la
					plateforme sont protégés par les dispositions applicables en
					matière de propriété intellectuelle.
				</p>

				<h2 class="font-title">12. Disponibilité</h2>

				<p>
					Ademyst met en œuvre des moyens raisonnables afin d'assurer
					la disponibilité et la sécurité du service.
				</p>

				<p>
					La plateforme peut toutefois être temporairement
					inaccessible en raison notamment de maintenance, d'incidents
					techniques ou de force majeure.
				</p>

				<h2 class="font-title">13. Suppression du compte</h2>

				<p>
					L'utilisateur peut supprimer son compte conformément aux
					fonctionnalités proposées par la plateforme.
				</p>

				<p>
					Ademyst peut suspendre ou supprimer un compte en cas de
					violation des présentes CGU ou lorsque cela est nécessaire à
					la sécurité de la plateforme.
				</p>

				<h2 class="font-title">14. Données personnelles</h2>

				<p>
					Les traitements de données personnelles réalisés dans le
					cadre d'Ademyst sont décrits dans la
					<a
						href="/legal/privacy"
						class="text-orange-500 hover:underline"
					>
						Politique de confidentialité </a
					>.
				</p>

				<h2 class="font-title">15. Droit applicable</h2>

				<p>
					Les présentes CGU sont soumises au droit français, sous
					réserve des dispositions impératives dont pourrait
					bénéficier l'utilisateur.
				</p>

				<h2 class="font-title">16. Contact</h2>

				<p>Pour toute question concernant ces conditions :</p>

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
	</section>
</template>
