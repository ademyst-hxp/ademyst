<script setup lang="ts">
defineProps<{
	rarity: "common" | "rare" | "epic" | "collector" | "legendary" | "unclassified";
}>();

const labels = {
	common: "Commun",
	rare: "Rare",
	epic: "Épique",
	collector: "Collector",
	legendary: "Légendaire",
	unclassified: "Non classé",
};
</script>
<template>
	<div
		class="rounded-full px-3 py-1.5 text-xs font-semibold border"
		:class="{
			'bg-slate-500/30 text-slate-500 border-slate-500/30': rarity === 'common',
			'bg-blue-500/30 text-blue-500 border-blue-500/30': rarity === 'rare',
			'bg-purple-500/30 text-purple-500 border-purple-500/30': rarity === 'epic',
			'bg-yellow-500/30 text-yellow-500 border-yellow-500/30': rarity === 'collector',
			'bg-linear-to-br from-amber-500 to-rose-500 text-white border-0': rarity === 'legendary',
			'bg-gray-500/30 text-gray-500 border-gray-500/30': rarity === 'unclassified',
		}"
	>
		{{ labels[rarity] }}
	</div>
</template>
