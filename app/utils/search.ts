import {
	SEARCH_COUNT_MAX,
	SEARCH_FIELDS,
	SEARCH_FLAG_GROUPS,
	SEARCH_QUERY_MAX_LENGTH,
	SEARCH_QUERY_MIN_LENGTH,
	SEARCH_REPLIES,
	SEARCH_SORTS,
} from "~~/shared/consts/search";

import type {
	PostSearchField,
	PostSearchReplies,
	PostSearchSort,
} from "~~/shared/models/search";

/*
 * État du formulaire de recherche et conversions :
 *   formulaire <-> paramètres d'URL de la page  (partageables, bouton retour)
 *   formulaire  -> paramètres de l'API
 * La page et l'API partagent les mêmes noms de paramètres.
 */

export type SearchForm = {
	q: string;

	// Où chercher (au moins un des trois)
	content: boolean;
	author: boolean;
	tags: boolean;

	// Dates de création, au format des <input type="date"> (AAAA-MM-JJ)
	after: string;
	before: string;

	minLinks: number | null;
	maxLinks: number | null;
	minImages: number | null;
	maxImages: number | null;
	minLikes: number | null;
	minAnswers: number | null;

	replies: PostSearchReplies;
	sort: PostSearchSort;

	from: string;
	following: boolean;

	hideSensitive: boolean;
	hideAI: boolean;
};

export const emptySearchForm = (): SearchForm => ({
	q: "",
	content: true,
	author: true,
	tags: true,
	after: "",
	before: "",
	minLinks: null,
	maxLinks: null,
	minImages: null,
	maxImages: null,
	minLikes: null,
	minAnswers: null,
	replies: "include",
	sort: "recent",
	from: "",
	following: false,
	hideSensitive: false,
	hideAI: false,
});

type RouteQuery = Record<string, unknown>;

const first = (value: unknown): string | null => {
	const single = Array.isArray(value) ? value[0] : value;

	return typeof single === "string" && single !== "" ? single : null;
};

const toCount = (value: unknown): number | null => {
	const raw = first(value);

	if (raw === null || !/^\d{1,4}$/.test(raw)) return null;

	return Math.min(Number(raw), SEARCH_COUNT_MAX);
};

const toDay = (value: unknown): string => {
	const raw = first(value);

	return raw !== null && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
};

const pick = <T extends string>(
	value: unknown,
	allowed: readonly T[],
	fallback: T,
): T => {
	const raw = first(value);

	return raw !== null && (allowed as readonly string[]).includes(raw)
		? (raw as T)
		: fallback;
};

/** Paramètres d'URL -> formulaire (valeurs inconnues ou invalides ignorées). */
export const searchFormFromQuery = (query: RouteQuery): SearchForm => {
	const form = emptySearchForm();

	form.q = (first(query.q) ?? "").slice(0, SEARCH_QUERY_MAX_LENGTH);

	const scopes = first(query.in)?.split(",") ?? [];
	const chosen = SEARCH_FIELDS.filter((field) => scopes.includes(field));

	if (chosen.length > 0) {
		form.content = chosen.includes("content");
		form.author = chosen.includes("author");
		form.tags = chosen.includes("tags");
	}

	form.after = toDay(query.after);
	form.before = toDay(query.before);

	form.minLinks = toCount(query.min_links);
	form.maxLinks = toCount(query.max_links);
	form.minImages = toCount(query.min_images);
	form.maxImages = toCount(query.max_images);
	form.minLikes = toCount(query.min_likes);
	form.minAnswers = toCount(query.min_answers);

	form.replies = pick(query.replies, SEARCH_REPLIES, "include");
	form.sort = pick(query.sort, SEARCH_SORTS, "recent");

	form.from = (first(query.from) ?? "").replace(/^@/, "").slice(0, 16);
	form.following = first(query.following) === "true";

	const hidden = first(query.exclude_flags)?.split(",") ?? [];

	form.hideSensitive = SEARCH_FLAG_GROUPS.sensitive.every((flag) =>
		hidden.includes(flag),
	);
	form.hideAI = SEARCH_FLAG_GROUPS.ai.every((flag) => hidden.includes(flag));

	return form;
};

const selectedFields = (form: SearchForm): PostSearchField[] =>
	SEARCH_FIELDS.filter((field) => form[field]);

const excludedFlags = (form: SearchForm): string[] => [
	...(form.hideSensitive ? SEARCH_FLAG_GROUPS.sensitive : []),
	...(form.hideAI ? SEARCH_FLAG_GROUPS.ai : []),
];

// Début / fin de la journée LOCALE choisie, en instants absolus (ISO 8601).
const dayBoundary = (day: string, boundary: "start" | "end"): string => {
	const [year, month, date] = day.split("-").map(Number) as [
		number,
		number,
		number,
	];

	return (
		boundary === "start"
			? new Date(year, month - 1, date, 0, 0, 0, 0)
			: new Date(year, month - 1, date, 23, 59, 59, 999)
	).toISOString();
};

/**
 * Formulaire -> paramètres communs (page ET API). Seules les valeurs
 * différentes des valeurs par défaut sont émises ; les dates restent au
 * format AAAA-MM-JJ.
 */
export const searchFormToQuery = (
	form: SearchForm,
): Record<string, string> => {
	const query: Record<string, string> = { q: form.q.trim() };

	const fields = selectedFields(form);

	if (fields.length > 0 && fields.length < SEARCH_FIELDS.length) {
		query.in = fields.join(",");
	}

	if (form.after) query.after = form.after;
	if (form.before) query.before = form.before;

	const counts = {
		min_links: form.minLinks,
		max_links: form.maxLinks,
		min_images: form.minImages,
		max_images: form.maxImages,
		min_likes: form.minLikes,
		min_answers: form.minAnswers,
	};

	for (const [name, value] of Object.entries(counts)) {
		if (value !== null) query[name] = String(value);
	}

	if (form.replies !== "include") query.replies = form.replies;
	if (form.sort !== "recent") query.sort = form.sort;

	if (form.from.trim()) query.from = form.from.trim().replace(/^@/, "");
	if (form.following) query.following = "true";

	const flags = excludedFlags(form);

	if (flags.length > 0) query.exclude_flags = flags.join(",");

	return query;
};

/**
 * Formulaire -> paramètres de GET /api/v1/search/posts. Les jours choisis
 * sont interprétés dans le fuseau de l'utilisateur.
 */
export const searchFormToApiParams = (
	form: SearchForm,
	offset = 0,
	limit?: number,
): Record<string, string | number> => {
	const params: Record<string, string | number> = searchFormToQuery(form);

	if (form.after) params.after = dayBoundary(form.after, "start");
	if (form.before) params.before = dayBoundary(form.before, "end");

	if (offset > 0) params.offset = offset;
	if (limit) params.limit = limit;

	return params;
};

/** Nombre de réglages qui s'écartent de la recherche par défaut (hors texte). */
export const countActiveFilters = (form: SearchForm): number => {
	const defaults = emptySearchForm();

	const changed = [
		selectedFields(form).length !== SEARCH_FIELDS.length,
		form.after !== defaults.after,
		form.before !== defaults.before,
		form.minLinks !== null,
		form.maxLinks !== null,
		form.minImages !== null,
		form.maxImages !== null,
		form.minLikes !== null,
		form.minAnswers !== null,
		form.replies !== defaults.replies,
		form.from.trim() !== "",
		form.following,
		form.hideSensitive,
		form.hideAI,
	];

	return changed.filter(Boolean).length;
};

export const isSearchableQuery = (q: string): boolean =>
	q.trim().length >= SEARCH_QUERY_MIN_LENGTH &&
	q.trim().length <= SEARCH_QUERY_MAX_LENGTH;

/** Incohérences que l'API refuserait : affichées avant d'envoyer la requête. */
export const searchFormErrors = (form: SearchForm): string[] => {
	const errors: string[] = [];

	if (form.after && form.before && form.after > form.before) {
		errors.push("La date « Après le » doit précéder « Avant le ».");
	}

	if (
		form.minLinks !== null &&
		form.maxLinks !== null &&
		form.minLinks > form.maxLinks
	) {
		errors.push("Le minimum de liens dépasse le maximum.");
	}

	if (
		form.minImages !== null &&
		form.maxImages !== null &&
		form.minImages > form.maxImages
	) {
		errors.push("Le minimum d'images dépasse le maximum.");
	}

	return errors;
};
