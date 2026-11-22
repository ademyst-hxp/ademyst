<script setup lang="ts">
import { useId } from "vue";

// Pas de <use xlink:href> ici : les identifiants fixes des autres formes
// (stroke0_1_2…) sont partagés par toutes les instances de la page. Le seul
// identifiant de ce composant est généré par useId().
const gradientId = `final-quest-gradient-${useId()}`;
</script>
<template>
	<svg
		viewBox="0 0 640 640"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<!-- Rubans, derrière l'étoile -->
		<path
			d="M200 390L335 390L318 616L268 574L214 626Z"
			fill="#C89938"
		/>
		<path
			d="M200 390L335 390L318 616L268 574L214 626Z"
			fill="black"
			fill-opacity="0.15"
		/>
		<path
			d="M440 390L305 390L322 616L372 574L426 626Z"
			fill="#C89938"
		/>
		<path
			d="M440 390L305 390L322 616L372 574L426 626Z"
			fill="black"
			fill-opacity="0.25"
		/>

		<!-- Étoile à 8 branches -->
		<defs>
			<linearGradient
				:id="gradientId"
				x1="105"
				y1="85"
				x2="535"
				y2="515"
				gradientUnits="userSpaceOnUse"
			>
				<stop stop-opacity="0" />
				<stop offset="1" />
			</linearGradient>
		</defs>
		<path
			d="M320 85L377.4 161.42L472.03 147.97L458.58 242.6L535 300L458.58 357.4L472.03 452.03L377.4 438.58L320 515L262.6 438.58L167.97 452.03L181.42 357.4L105 300L181.42 242.6L167.97 147.97L262.6 161.42Z"
			fill="#C89938"
		/>
		<path
			d="M320 85L377.4 161.42L472.03 147.97L458.58 242.6L535 300L458.58 357.4L472.03 452.03L377.4 438.58L320 515L262.6 438.58L167.97 452.03L181.42 357.4L105 300L181.42 242.6L167.97 147.97L262.6 161.42Z"
			:fill="`url(#${gradientId})`"
			fill-opacity="0.12"
		/>

		<!-- Anneau central (même principe que les autres niveaux) -->
		<path
			d="M320 160A140 140 0 1 1 319.99 160ZM320 182A118 118 0 1 0 320.01 182Z"
			fill-rule="evenodd"
			clip-rule="evenodd"
			fill="black"
			fill-opacity="0.1"
		/>

		<foreignObject x="240" y="220" width="160" height="160">
			<div xmlns="http://www.w3.org/1999/xhtml" class="quest-content">
				<slot />
			</div>
		</foreignObject>
	</svg>
</template>
<style scoped>
.quest-content {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	text-align: center;
	box-sizing: border-box;
	overflow: hidden;
	overflow-wrap: anywhere;
	font-size: 28px;
	line-height: 1.2;
	color: var(--quest-text, #fff);
}
</style>
