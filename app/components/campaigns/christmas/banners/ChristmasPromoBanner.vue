<script setup lang="ts">
import { GiftIcon, SparklesIcon } from "@heroicons/vue/24/outline";

import {
	getChristmasEnd,
	getChristmasPhase,
	getChristmasStart,
} from "~~/shared/utils/campaigns/christmas";

import CountdownTimer from "../countdown/CountdownTimer.vue";

const PRESENTATION_PATH = "/campaigns/christmas";

const route = useRoute();
const now = useClock();

// Avant le montage on se base sur l'heure du rendu : seule la phase (jour près)
// décide de l'affichage, les secondes ne sont rendues qu'après le montage.
const phase = computed(() => getChristmasPhase(now.value ?? Date.now()));

// Inutile sur les pages de la campagne elles-mêmes.
const visible = computed(
	() => phase.value !== "ended" && !route.path.startsWith(PRESENTATION_PATH),
);
</script>
<template>
	<NuxtLink
		v-if="visible"
		:to="PRESENTATION_PATH"
		class="group relative isolate flex h-24 overflow-hidden items-center justify-center gap-3 rounded-3xl border-2 border-[#d3ad60] bg-linear-to-r from-[#9f0817] via-[#c50d1c] to-[#7d0912] px-3 text-center text-white shadow-[0_12px_35px_rgba(197,13,28,0.28)] transition-transform duration-300 hover:-translate-y-0.5 sm:px-5 md:justify-between md:px-8"
	>
		<div
			class="absolute -left-10 -top-16 h-36 w-36 rounded-full border-18 border-[#f4d58d]/10"
			aria-hidden="true"
		/>
		<div
			class="absolute -bottom-14 right-24 h-28 w-28 rounded-full bg-[#f4d58d]/10 blur-sm"
			aria-hidden="true"
		/>
		<SparklesIcon
			class="absolute right-28 top-3 h-5 w-5 text-[#f4d58d]/80"
			aria-hidden="true"
		/>

		<span class="relative flex min-w-0 items-center gap-3 font-bold font-title text-sm sm:text-lg md:text-xl">
			<span
				class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#f4d58d]/50 bg-[#f4d58d]/15 shadow-inner"
			>
				<GiftIcon class="h-7 w-7 text-[#f4d58d]" aria-hidden="true" />
			</span>
			<template v-if="phase === 'upcoming'">
				<span class="max-w-52 sm:max-w-none">
					Les Quêtes de Noël commencent dans
				</span>
			</template>
			<template v-else>
				<span class="max-w-52 sm:max-w-none">
					Les Quêtes de Noël sont en cours !
				</span>
			</template>
		</span>

		<span class="relative flex shrink-0 items-center gap-2 sm:gap-3">
			<CountdownTimer
				v-if="phase === 'upcoming'"
				:target="getChristmasStart()"
				class="hidden rounded-2xl border border-white/15 bg-black/20 px-3 py-2 text-base font-bold shadow-inner sm:block sm:text-lg"
			/>
			<span
				v-else
				class="hidden text-sm text-white/85 md:block"
			>
				Fin dans
				<CountdownTimer
					:target="getChristmasEnd()"
					class="inline font-bold"
				/>
			</span>
			<Button
				label="Découvrir"
				size="small"
				variant="white"
				:handler="PRESENTATION_PATH"
			/>
		</span>
	</NuxtLink>
</template>
