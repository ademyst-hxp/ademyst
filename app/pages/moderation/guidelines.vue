```vue
<script setup lang="ts">
import {
	EnvelopeIcon,
	LockClosedIcon,
	ShieldCheckIcon,
	ScaleIcon,
} from "@heroicons/vue/24/outline";

definePageMeta({
	title: "Modération : Code de conduite",
	description: "Règles de fonctionnement et code de conduite de l'équipe de modération d'Ademyst.",
	layout: "blog",
});

useHead({
	title: "Modération : Code de conduite",
	meta: [
		{
			name: "viewport",
			content: "width=device-width, initial-scale=1.0",
		},
		{
			name: "robots",
			content: "noindex, nofollow",
		},
	],
});
</script>

<template>
	<Teleport to="#header">
		<h1 class="text-3xl font-bold text-center font-title">
			Code de conduite
		</h1>
	</Teleport>

	<header
		class="flex flex-col gap-3 rounded-3xl bg-surface border border-surface-border p-6 md:p-8"
	>
		<div class="flex items-center gap-3 text-secondary">
			<ShieldCheckIcon class="w-7 h-7" />
			<span class="font-semibold">Équipe de modération</span>
		</div>

		<h2 class="text-3xl font-bold font-title">
			Règlement de modération
		</h2>

		<p class="text-muted">Dernière mise à jour : 29 octobre 2026</p>
		<p class="text-muted">Entrée en vigueur : 06 novembre 2026</p>
	</header>

	<article
		class="rounded-3xl bg-surface border border-surface-border p-6 md:p-8"
	>
		<div class="prose prose-surface max-w-none post-content -mx-2 md:-mx-4">
			<h2 class="font-title">1. Objet et principes généraux</h2>

			<p>
				La modération d'Ademyst a pour mission de veiller au respect
				des Conditions Générales d'Utilisation (CGU), de contenir les
				abus et de limiter leur impact sur les utilisateurs et sur la
				plateforme.
			</p>

			<p>
				Elle contribue à préserver un espace d'échange fidèle à la
				philosophie d'Ademyst : favoriser la réflexion, l'argumentation
				et la qualité des discussions, tout en luttant contre la
				désinformation et les comportements qui nuisent au bon
				fonctionnement du réseau.
			</p>

			<p>
				Toute intervention de modération doit reposer sur des motifs
				objectifs, en accord avec les règles applicables sur la
				plateforme. Les décisions ne doivent pas être motivées par des
				préférences personnelles, des différends privés ou de simples
				désaccords idéologiques, mais par des éléments pertinents au
				regard des règles en vigueur.
			</p>

			<p>
				La modération s'exerce selon une structure hiérarchique à trois
				niveaux, définie par les grades des comptes.
			</p>

			<h2 class="font-title">2. Organisation et hiérarchie</h2>

			<h3 class="font-title">
				2.1. Niveau assistant — Aide Modération (grade 6)
			</h3>

			<p>
				Le grade <strong>Aide Modération</strong>, correspondant au
				niveau 6 dans la base de données, l'API et l'interface de la
				plateforme, constitue le premier niveau de modération.
			</p>

			<p>Ses titulaires sont habilités à :</p>

			<ul class="list-disc list-inside">
				<li>
					consulter et traiter les signalements relevant de leurs
					permissions ;
				</li>
				<li>
					examiner les contenus signalés et apprécier leur conformité
					aux règles applicables ;
				</li>
				<li>
					appliquer des sanctions légères sous la forme de marqueurs
					sur les publications, lorsque les outils disponibles le
					permettent ;
				</li>
				<li>
					contribuer à limiter la propagation ou l'impact des contenus
					problématiques dans les limites de leurs autorisations.
				</li>
			</ul>

			<p>
				Le grade Aide Modération ne confère pas les pouvoirs
				disciplinaires complets d'un Modérateur. Ses titulaires ne
				peuvent notamment pas appliquer les sanctions réservées aux
				niveaux supérieurs.
			</p>

			<h3 class="font-title">
				2.2. Niveau titulaire — Modérateur (grade 7)
			</h3>

			<p>
				Le grade <strong>Modérateur</strong>, correspondant au niveau 7
				dans la base de données, l'API et l'interface, constitue le
				niveau titulaire de la modération.
			</p>

			<p>Ses titulaires sont habilités à :</p>

			<ul class="list-disc list-inside">
				<li>consulter et traiter les signalements ;</li>
				<li>
					examiner les comportements et les contenus susceptibles de
					contrevenir aux règles ;
				</li>
				<li>
					appliquer l'ensemble des sanctions disponibles sur la
					plateforme aux membres dont le grade est strictement
					inférieur au niveau 6 ;
				</li>
				<li>
					intervenir sur les publications et les comptes concernés,
					dans la limite des sanctions prévues par les outils de
					modération et des règles applicables.
				</li>
			</ul>

			<p>
				Les Modérateurs disposent de prérogatives plus étendues que
				les Aides Modération. Ils doivent néanmoins exercer leurs
				pouvoirs dans le respect des présentes règles, des CGU et de
				la législation applicable.
			</p>

			<h3 class="font-title">
				2.3. Niveau supérieur — Équipe Ademyst (grade 8) et Fondateur
				(grade 9)
			</h3>

			<p>
				Les membres de l'<strong>Équipe Ademyst</strong>, de grade 8,
				ainsi que le <strong>Fondateur</strong>, de grade 9, bénéficient
				de l'ensemble des permissions attribuées au grade Modérateur.
			</p>

			<p>
				Ils disposent en outre d'une compétence de supervision interne
				leur permettant d'intervenir sur les actes et les décisions
				des Modérateurs lorsque ceux-ci présentent un problème de
				comportement, un abus de pouvoir ou un manquement aux règles.
			</p>

			<p>À ce titre, ils peuvent notamment :</p>

			<ul class="list-disc list-inside">
				<li>
					examiner les actions de modération réalisées par les grades
					inférieurs ;
				</li>
				<li>
					intervenir lorsqu'un Modérateur utilise ses permissions
					de manière inappropriée ;
				</li>
				<li>
					prendre les mesures internes appropriées, pouvant inclure
					le retrait ou la restriction des permissions de modération.
				</li>
			</ul>

			<p>
				Ces prérogatives visent à garantir la sécurité de la plateforme
				et le bon fonctionnement de l'équipe. Elles ne dispensent pas
				leurs titulaires du respect des règles applicables.
			</p>

			<div
				class="not-prose flex items-center gap-3 rounded-2xl bg-violet-50 border border-violet-100 p-5 text-violet-950"
			>
				<ScaleIcon class="w-6 h-6 shrink-0" />

				<p>
					Les permissions de modération dépendent du grade attribué
					au compte. Elles ne constituent pas un pouvoir personnel
					illimité sur les utilisateurs.
				</p>
			</div>

			<h2 class="font-title">
				3. Traitement des signalements et sanctions
			</h2>

			<p>
				Les membres de l'équipe de modération interviennent dans le
				périmètre de leurs permissions respectives afin de traiter les
				signalements et de limiter les abus constatés sur la plateforme.
			</p>

			<p>
				Chaque intervention doit être fondée sur les éléments
				disponibles et sur les règles applicables. La seule existence
				d'un signalement ne constitue pas, à elle seule, une preuve
				de manquement.
			</p>

			<p>
				Les sanctions doivent être appliquées dans les limites des
				pouvoirs accordés au grade concerné. Un membre de l'équipe de
				modération ne peut pas s'attribuer des permissions relevant
				d'un niveau hiérarchique supérieur.
			</p>

			<p>
				Les décisions de modération ne doivent pas servir à régler
				des différends personnels, à favoriser certains utilisateurs
				ou à sanctionner une personne en raison d'un simple désaccord
				avec les opinions qu'elle exprime.
			</p>

			<p>
				La présente section définit le cadre général de traitement des
				signalements. Les modalités détaillées de chaque sanction,
				ses conditions d'application et les éventuelles procédures
				de contestation relèvent des règles et fonctionnalités
				spécifiques mises en place par Ademyst.
			</p>

			<h2 class="font-title">
				4. Bénévolat et absence d'obligation de performance
			</h2>

			<p>
				La plupart des fonctions de modération sur Ademyst sont
				exercées à titre bénévole. Elles reposent sur la participation
				volontaire de personnes souhaitant contribuer au bon
				fonctionnement de la plateforme.
			</p>

			<p>
				Sauf engagement distinct expressément accepté par la personne
				concernée, l'attribution d'un grade de modération ne crée
				aucune obligation de disponibilité, de permanence, de volume
				minimal de signalements traités ou de résultat à atteindre.
			</p>

			<p>
				Sous réserve du respect des présentes règles, des CGU et des
				autres dispositions légales applicables, le titulaire d'un
				grade de modération n'est soumis à aucune obligation générale
				de rendre compte de son activité, de justifier une absence
				ou d'atteindre des objectifs de performance.
			</p>

			<p>
				L'exercice de cette fonction ne constitue donc pas, à lui seul,
				un engagement à fournir un travail régulier ou à assurer un
				service continu à la plateforme.
			</p>

			<p>
				Cette absence d'obligation de performance n'autorise toutefois
				ni l'abus des permissions accordées, ni le contournement des
				règles, ni l'utilisation des outils de modération à des fins
				étrangères à leur objet.
			</p>

			<h2 class="font-title">
				5. Supervision et maintien des permissions
			</h2>

			<p>
				Dans un souci de sécurité, de fiabilité et d'optimisation de
				la plateforme, Ademyst se réserve le droit de superviser
				l'activité réalisée au moyen des permissions de modération.
			</p>

			<p>
				Cette supervision peut notamment porter sur les sanctions
				appliquées, le traitement des signalements et l'utilisation
				des outils mis à disposition, dans le respect des règles
				applicables en matière de protection des données et de
				confidentialité.
			</p>

			<p>
				Ademyst se réserve également le droit de modifier, de
				restreindre, de suspendre ou de retirer les permissions de
				modération d'un membre, notamment lorsque :
			</p>

			<ul class="list-disc list-inside">
				<li>la sécurité de la plateforme le nécessite ;</li>
				<li>
					une utilisation inappropriée des permissions est constatée
					ou raisonnablement suspectée ;
				</li>
				<li>
					un manquement aux présentes règles ou aux CGU est identifié ;
				</li>
				<li>
					une évolution technique, organisationnelle ou fonctionnelle
					justifie une modification des autorisations ;
				</li>
				<li>
					le maintien des permissions présente un risque pour la
					plateforme ou ses utilisateurs.
				</li>
			</ul>

			<p>
				Le retrait des permissions ne suppose pas nécessairement
				l'existence d'une faute. Ademyst peut également prendre des
				mesures préventives ou organisationnelles lorsque les
				circonstances le justifient.
			</p>

			<p>
				La qualité de bénévole et l'absence d'obligation de performance
				ne confèrent donc aucun droit acquis au maintien d'un grade
				ou des permissions qui lui sont associées.
			</p>

			<h2 class="font-title">
				6. Responsabilité et limites de la fonction
			</h2>

			<p>
				Chaque membre de l'équipe de modération est tenu de respecter
				les règles applicables à son activité sur Ademyst, notamment
				les présentes dispositions, les CGU et la législation pertinente.
			</p>

			<p>
				Les permissions accordées sont limitées à celles prévues par
				le système de grades et les outils de la plateforme. Elles
				ne constituent ni une autorisation générale d'agir au nom
				d'Ademyst en dehors de ce cadre, ni un pouvoir illimité sur
				les utilisateurs.
			</p>

			<p>
				Les membres de l'équipe ne doivent pas détourner leurs
				permissions, intervenir arbitrairement ou utiliser leur
				position à des fins personnelles.
			</p>

			<p>
				Ademyst conserve la faculté de prendre les mesures nécessaires
				au bon fonctionnement de la plateforme, y compris à l'égard
				des membres de sa propre équipe.
			</p>

			<h2 class="font-title">7. Évolution du règlement</h2>

			<p>
				Le présent règlement peut être modifié afin de tenir compte
				de l'évolution des fonctionnalités, de l'organisation de la
				modération, des besoins de sécurité ou des obligations légales
				d'Ademyst.
			</p>

			<p>
				Les membres de l'équipe de modération sont tenus de respecter
				la version applicable du règlement dans le cadre de leurs
				interventions.
			</p>

			<p>
				En cas de contradiction entre les permissions techniques
				effectivement accordées et les règles définissant les pouvoirs
				d'un grade, les présentes dispositions définissent le cadre
				normatif attendu. Les anomalies techniques ou incohérences
				de permissions doivent être signalées et corrigées par les
				personnes habilitées.
			</p>

			<div
				class="not-prose flex flex-col rounded-2xl bg-surface border border-surface-border p-5"
			>
				<div class="flex items-center gap-3">
					<LockClosedIcon class="w-6 h-6 text-violet-500 shrink-0" />
					<span class="font-semibold">Principe fondamental</span>
				</div>

				<p>
					Les permissions de modération sont accordées pour protéger
					la qualité des échanges et le bon fonctionnement d'Ademyst.
					Elles constituent une prérogative fonctionnelle, et non
					un pouvoir personnel sur les utilisateurs. Leur exercice
					demeure encadré par les règles de la plateforme, tandis
					que leur maintien relève de la décision d'Ademyst.
				</p>
			</div>

			<h2 class="font-title">8. Contact</h2>

			<p>
				Pour toute question relative au présent règlement ou au
				fonctionnement de la modération, vous pouvez contacter
				l'équipe d'Ademyst par les moyens de contact officiels
				de la plateforme.
			</p>

			<div
				class="not-prose flex items-center gap-3 rounded-2xl bg-surface border border-surface-border px-6 py-4"
			>
				<EnvelopeIcon class="w-6 h-6 text-primary" />

				<div class="-space-y-1 m-0!">
					<span class="block font-semibold">Équipe Ademyst</span>
					<span class="block text-muted">
						Contact via les canaux officiels d'Ademyst
					</span>
				</div>
			</div>
		</div>
	</article>
</template>
```
