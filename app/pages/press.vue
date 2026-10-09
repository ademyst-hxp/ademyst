<script setup lang="ts">
import { BuildingOffice2Icon } from "@heroicons/vue/24/outline";

definePageMeta({
	title: "Ademyst: Manifeste",
	description:
		"Le projet part avec cette idée simple: Internet peut être un endroit où l’on échange des idées, pas seulement où l’on consomme du contenu.",
	layout: "blog",
});

useHead({
	title: "Ademyst: Manifeste",
	meta: [
		{
			name: "description",
			content:
				"Le projet part avec cette idée simple: Internet peut être un endroit où l’on échange des idées, pas seulement où l’on consomme du contenu.",
		},
		{
			name: "keywords",
			content:
				"Ademyst, manifeste, projet, internet, échange d'idées, contenu",
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
		<h1 class="text-3xl font-bold text-center font-title">Manifeste</h1>
	</Teleport>

	<header
		class="flex flex-col gap-3 rounded-3xl bg-surface border border-surface-border p-6 md:p-8"
	>
		<div class="flex items-center gap-3 text-orange-500">
			<BuildingOffice2Icon class="w-7 h-7" />
			<span class="font-semibold">Ademyst</span>
		</div>

		<h2 class="text-3xl font-bold font-title">Manifeste</h2>

		<p class="text-muted">Publié le: 07 octobre 2026</p>
	</header>

	<article
		class="rounded-3xl bg-surface border border-surface-border p-6 md:p-8"
	>
		<div class="prose prose-surface max-w-none post-content -mx-2 md:-mx-4">
			<p>
				Ademyst est un réseau social pensé pour ceux qui veulent sortir
				du bruit infini des réseaux traditionnels.
			</p>

			<p class="text-lg">
				Le projet part avec cette idée simple:
				<strong>
					Internet peut être un endroit où l’on échange des idées, pas
					seulement où l’on consomme du contenu.
				</strong>
			</p>

			<p>
				Pour contexte, Ademyst est la continuité de Beam, un projet
				étudiant que j’ai surtout fait pour la satisfaction personnelle.
				Me rendant compte de tous les problèmes que le projet initial
				présentait (problèmes d’UX, développement, stabilité,
				modélisation des données, etc.) je suis reparti de zéro pour le
				recoder. C’est alors que j’en ai profité pour donner une
				identité au projet: j’ai trouvé un nom, des couleurs, un univers
				graphique et un positionnement. Alors que Beam se revendique
				comme un simple “projet étudiant” qui ne percera jamais et à mon
				plus grand bonheur, Ademyst se veut être une plateforme en
				rupture avec le modèle traditionnel des réseaux sociaux: des
				plateformes dont notre flou cognitif est le business model, et
				que les États-Unis tiennent par le sac. C’est pourquoi je
				prévois, une fois le projet assez développé et “rentable”, de
				switcher de Cloudflare et AWS pour me rediriger vers une
				alternative Européenne, encore en recherche actuellement. Je
				veux créer un endroit où les utilisateurs échangent
				spontanément, mais aussi un terrain qui permet à ceux qui le
				veulent de débattre ou de discuter en développant leur propos et
				en le sourçant.
			</p>

			<p>
				Ademyst sera avant tout un réseau social militant, défendant
				farouchement son opposition aux contenus générés par IA, à la
				capitalisation de l’influence et à la désinformation. Telle sera
				notre philosophie. Tout sera mis en œuvre pour encourager soit à
				la spontanéité, soit à la réflexion poussée. Les comptes seront
				divisés en plusieurs paliers, en plus des paliers traditionnels
				de modération (mod, muted, regular, etc.). Les publications
				étant le fil conducteur du réseau, celles-ci seront le principal
				élément concerné par la philosophie à adopter, et sont donc
				conditionnées pour: limite allant de 1000 à 5000 caractères au
				lieu des 260 de Twitter, Markdown pour structurer le propos,
				flags d’avertissement… La raison pour laquelle j’ai choisi un
				format Twitter-like au lieu d’être imagé comme Instagram ou
				TikTok est que j’ai constaté que l’on vit dans une époque où
				l’écriture se perd de plus en plus au profit de l’oral. Or,
				l’argumentation orale introduit dans le processus d’assimilation
				d’une information tout un tas de signaux parasites qui biaisent
				ce dernier. Ce n’est pas pour rien que le charisme et la
				présence se travaillent surtout à l’oral. L’écrit permet de
				recevoir l’information en brut, sans une grande partie de ces
				signaux parasites.
			</p>
		</div>
	</article>
</template>
