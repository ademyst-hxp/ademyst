<!--
	Auth layout with the spash screen
-->
<style scoped>
#citation {
	background-image: url("https://u.cubeupload.com/The_seven_remix/nOB5Rj.jpg");
}
</style>
<script setup lang="ts">
const quotes: {
	text: string;
	author: string;
}[] = [
	{
		text: "« Merde, j'ai cassé Beam »",
		author: "Loan, une trentaine de fois.",
	},
	{
		text: "Pour contexte, Ademyst est la continuité de Beam, un projet étudiant...",
		author: "Loan, Manifeste d'Ademyst (2026)",
	},
	{
		text: "Ademyst se veut [...] en rupture avec le modèle traditionnel des réseaux sociaux.",
		author: "Loan, Manifeste d'Ademyst (2026)",
	},
	{
		text: "On vit dans une époque où l’écriture se perd de plus en plus au profit de l’oral.",
		author: "Loan, Manifeste d'Ademyst (2026)",
	},
];

const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]!;
</script>
<template>
	<div class="min-h-dvh _no_container flex flex-row-reverse h-screen">
		<div
			class="hidden lg:flex flex-col items-center justify-center bg-[url('/images/splash_1.webp')] bg-cover bg-center text-white p-16 lg:w-1/2"
		>
			<div
				id="citation"
				class="bg-cover bg-center rounded-3xl w-lg max-w-full overflow-hidden"
			>
				<div
					class="flex flex-col justify-end gap-2 bg-black/50 backdrop-grayscale h-80 p-8"
				>
					<h2 class="text-xl font-bold font-serif">
						{{ randomQuote.text }}
					</h2>
					<p class="font-serif italic opacity-75">
						{{ randomQuote.author }}
					</p>
				</div>
			</div>
		</div>
		<div
			class="flex flex-col justify-center items-center gap-2 p-6 max-lg:grow lg:w-1/2 lg:mx-auto"
		>
			<slot />
		</div>
	</div>
</template>
