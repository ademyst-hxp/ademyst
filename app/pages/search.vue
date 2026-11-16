<script setup lang="ts">
import {
	AdjustmentsHorizontalIcon,
	ArrowPathIcon,
	MagnifyingGlassIcon,
} from "@heroicons/vue/24/outline";

import {
	SEARCH_PAGE_SIZE,
	SEARCH_QUERY_MAX_LENGTH,
	SEARCH_QUERY_MIN_LENGTH,
	SEARCH_SORTS,
} from "~~/shared/consts/search";
import {
	countActiveFilters,
	emptySearchForm,
	isSearchableQuery,
	searchFormErrors,
	searchFormFromQuery,
	searchFormToApiParams,
	searchFormToQuery,
} from "~/utils/search";

import type { ListPage } from "~/composables/usePaginatedList";
import type { Post } from "~~/shared/models/interactions";
import type {
	PostSearchResponse,
	PostSearchSort,
} from "~~/shared/models/search";

import Box from "~/components/base/Box.vue";
import Info from "~/components/boxes/Info.vue";
import Warning from "~/components/boxes/Warning.vue";
import Button from "~/components/Button.vue";
import InlineSelect from "~/components/InlineSelect.vue";
import Input from "~/components/Input.vue";
import PostBox from "~/components/interactions/Post.vue";
import SearchFilters from "~/components/search/SearchFilters.vue";

definePageMeta({
	title: "Ademyst: Recherche",
	description: "Recherchez des publications sur Ademyst.",
	middleware: ["auth"],
});

useHead({
	title: "Ademyst: Recherche",
	meta: [
		{
			name: "description",
			content: "Recherchez des publications sur Ademyst.",
		},
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

const { $api } = useNuxtApp();

const route = useRoute();
const router = useRouter();

/* -------------------------------------------------------------------------- */
/*  Formulaire (ce que l'utilisateur est en train de saisir)                  */
/* -------------------------------------------------------------------------- */

const form = ref(searchFormFromQuery(route.query));

const showFilters = ref(countActiveFilters(form.value) > 0);

const activeFilters = computed(() => countActiveFilters(form.value));
const errors = computed(() => searchFormErrors(form.value));

const canSubmit = computed(
	() => isSearchableQuery(form.value.q) && errors.value.length === 0,
);

/* -------------------------------------------------------------------------- */
/*  Recherche en cours (ce que dit l'URL : partageable, bouton retour OK)     */
/* -------------------------------------------------------------------------- */

const current = computed(() => searchFormFromQuery(route.query));
const hasSearch = computed(() => isSearchableQuery(current.value.q));

const fetchPage = async (offset: number): Promise<ListPage<Post>> => {
	const response = await $api<PostSearchResponse>("/search/posts", {
		query: searchFormToApiParams(current.value, offset, SEARCH_PAGE_SIZE),
	});

	return {
		items: response.posts,
		next: response.next,
		hasNext: response.hasNext,
	};
};

const { items, hasNext, loadingMore, reset, loadMore } =
	usePaginatedList<Post>(fetchPage);

// Récupéré côté serveur puis réutilisé à l'hydratation ; relancé à chaque
// changement d'URL (nouvelle recherche, filtres, tri).
const { data, status, error, refresh } = await useAsyncData(
	"search-posts",
	async () => (hasSearch.value ? await fetchPage(0) : null),
	{ watch: [() => route.fullPath] },
);

watch(data, (page) => reset(page), { immediate: true });

const submit = async () => {
	if (!canSubmit.value) return;

	const target = router.resolve({
		query: searchFormToQuery(form.value),
	}).fullPath;

	// Même recherche : on la relance au lieu d'ignorer le clic.
	if (target === route.fullPath) {
		await refresh();
		return;
	}

	await router.push(target);
};

// L'URL est la source de vérité : retour arrière, lien partagé ou clic sur
// une recherche relancent tout et remettent le formulaire à jour.
watch(
	() => route.fullPath,
	() => {
		form.value = searchFormFromQuery(route.query);
	},
);

/* -------------------------------------------------------------------------- */
/*  Tri                                                                       */
/* -------------------------------------------------------------------------- */

const SORT_LABELS: Record<PostSearchSort, string> = {
	recent: "Récentes",
	oldest: "Anciennes",
	top: "Les plus aimées",
};

const sortOptions = SEARCH_SORTS.map((value) => ({
	value,
	label: SORT_LABELS[value],
}));

const changeSort = async (value: string) => {
	form.value = { ...form.value, sort: value as PostSearchSort };

	if (hasSearch.value) await submit();
};

const resetFilters = () => {
	form.value = {
		...emptySearchForm(),
		q: form.value.q,
		sort: form.value.sort,
	};
};

/* -------------------------------------------------------------------------- */
/*  Défilement infini                                                         */
/* -------------------------------------------------------------------------- */

const { sentinel, recheck } = useScrollSentinel(loadMore, () => hasNext.value);

// Si la première page ne remplit pas l'écran, on demande la suivante.
watch(status, (value) => {
	if (value === "success") nextTick(recheck);
});

/* -------------------------------------------------------------------------- */
/*  Messages                                                                  */
/* -------------------------------------------------------------------------- */

const errorMessage = computed(() => {
	const failure = error.value as {
		statusCode?: number;
		status?: number;
	} | null;

	switch (failure?.statusCode ?? failure?.status) {
		case 429:
			return "Trop de recherches en peu de temps. Réessayez dans une minute.";
		case 400:
			return "Cette recherche n'est pas valide. Vérifiez la requête et les filtres.";
		default:
			return "La recherche a échoué. Réessayez dans un instant.";
	}
});
</script>
<template>
	<Teleport to="#header">
		<h1 class="text-3xl font-bold text-center font-title">Recherche</h1>
	</Teleport>

	<Box>
		<div class="flex flex-col gap-2 sm:flex-row sm:items-start">
			<div class="w-full min-w-0 grow">
				<Input
					:icon="MagnifyingGlassIcon"
					placeholder="Un mot, un @pseudo, un #tag…"
					:model-value="form.q"
					:min-length="SEARCH_QUERY_MIN_LENGTH"
					:max-length="SEARCH_QUERY_MAX_LENGTH"
					@update:model-value="form.q = String($event ?? '')"
					@enter="submit"
				/>
			</div>

			<Button
				label="Rechercher"
				:icon="MagnifyingGlassIcon"
				:disabled="!canSubmit"
				:handler="submit"
			/>
		</div>

		<div class="flex flex-wrap items-center justify-between gap-2">
			<Button
				:label="
					activeFilters > 0 ? `Filtres (${activeFilters})` : 'Filtres'
				"
				:icon="AdjustmentsHorizontalIcon"
				:variant="activeFilters > 0 ? 'primary' : 'secondary'"
				size="small"
				:handler="() => (showFilters = !showFilters)"
			/>

			<InlineSelect
				:model-value="form.sort"
				:options="sortOptions"
				scale="small"
				@update:model-value="changeSort"
			/>
		</div>

		<SearchFilters
			v-if="showFilters"
			v-model="form"
			@reset="resetFilters"
		/>

		<Warning v-if="errors.length > 0" title="Filtres incohérents">
			{{ errors.join(" ") }}
		</Warning>
	</Box>

	<!-- Aucune recherche -->
	<Info v-if="!hasSearch" title="Que cherchez-vous ?">
		La recherche parcourt le contenu des publications, le pseudo et le nom
		de leurs auteurs, ainsi que leurs tags. Quelques lettres suffisent, la
		casse est ignorée.
	</Info>

	<!-- Chargement -->
	<div
		v-else-if="status === 'pending'"
		class="flex justify-center py-12 text-muted"
	>
		<ArrowPathIcon class="w-8 h-8 animate-spin" />
	</div>

	<!-- Erreur -->
	<Warning v-else-if="error" title="Recherche impossible">
		{{ errorMessage }}
	</Warning>

	<!-- Aucun résultat -->
	<div
		v-else-if="items.length === 0 && !hasNext"
		class="flex flex-col items-center gap-2 text-center py-12"
	>
		<MagnifyingGlassIcon class="w-24 h-24 text-muted/50 mx-auto" />
		<h2 class="text-2xl font-bold font-title px-8">Aucun résultat</h2>
		<p class="text-muted px-8">
			Rien ne correspond à « {{ current.q }} » avec ces filtres. Essayez
			un autre mot ou retirez des filtres.
		</p>
	</div>

	<!-- Résultats -->
	<section v-else class="flex flex-col gap-2 overflow-visible">
		<PostBox v-for="post in items" :key="'search-' + post.id" :data="post" />
	</section>

	<!-- Pagination sentinel -->
	<div ref="sentinel" class="flex justify-center py-6 text-muted">
		<ArrowPathIcon v-if="loadingMore" class="w-6 h-6 animate-spin" />
		<p
			v-else-if="hasSearch && status === 'success' && items.length > 0 && !hasNext"
			class="text-sm"
		>
			Fin des résultats.
		</p>
	</div>
</template>
