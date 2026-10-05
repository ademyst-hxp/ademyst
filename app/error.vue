<script setup lang="ts">
import type { NuxtError } from "#app";
const props = defineProps<{ error: NuxtError }>();

const { initTheme } = useTheme();

onMounted(() => {
	initTheme();
});
</script>
<template>
	<main
		class="_no_container bg-linear-to-tr from-primary to-secondary text-white h-screen p-6 md:p-12"
	>
		<section
			class="flex flex-col justify-center items-start gap-8 bg-linear-to-tr from-white/10 to-white/5 border-2 border-white/15 rounded-tl-[64px] rounded-br-[64px] rounded-bl-3xl rounded-tr-3xl h-full sm:items-center max-md:p-8"
		>
			<Icon class="max-sm:max-h-8 sm:h-16" />
			<template v-if="error.status === 404">
				<h1
					class="text-2xl font-bold font-title sm:text-center sm:text-4xl sm:max-w-xl"
				>
					Halte, cette page n'existe pas !
				</h1>
				<p class="text-lg sm:text-center sm:text-xl sm:max-w-xl">
					Ce n'est rien, les erreurs 404 ça arrive. Si tu es perdu(e)
					appuie sur le bouton ci-dessous pour retrouver ton chemin.
				</p>
			</template>
			<template v-else>
				<h1
					class="text-2xl font-bold font-title sm:text-center sm:text-4xl sm:max-w-xl"
				>
					Erreur {{ error.status }}
				</h1>
				<p class="text-lg sm:text-center sm:text-xl sm:max-w-xl">
					{{ error.statusText || "Aucun message d'erreur renvoyé." }}
				</p>
			</template>
			<nav>
				<ul class="flex items-center gap-4">
					<li>
						<Button
							label="Retour en lieu sûr"
							size="large"
							variant="white"
							handler="/"
						/>
					</li>
				</ul>
			</nav>
			<p class="justify-self-end italic max-w-xl sm:text-center">
				Aucune IA n'a été maltraitée durant la création de ce site.
			</p>
		</section>
	</main>
</template>
