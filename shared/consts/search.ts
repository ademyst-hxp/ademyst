import type {
	PostFlagType,
	PostSearchField,
	PostSearchReplies,
	PostSearchSort,
} from "~~/shared/models/search";

/*
 * Règles de la recherche de publications, partagées entre l'API et la page.
 * Données pures (pas d'icônes) : utilisables côté serveur.
 */

export const SEARCH_QUERY_MIN_LENGTH = 2;
export const SEARCH_QUERY_MAX_LENGTH = 64;

export const SEARCH_PAGE_SIZE = 20;
export const SEARCH_MAX_PAGE_SIZE = 50;

// Au-delà, la pagination par offset coûte trop cher : la recherche s'arrête.
export const SEARCH_MAX_OFFSET = 2000;

// Borne des filtres numériques (liens, images, likes, réponses)
export const SEARCH_COUNT_MAX = 1000;

export const SEARCH_FIELDS = [
	"content",
	"author",
	"tags",
] as const satisfies readonly PostSearchField[];

export const SEARCH_SORTS = [
	"recent",
	"oldest",
	"top",
] as const satisfies readonly PostSearchSort[];

export const SEARCH_REPLIES = [
	"include",
	"exclude",
	"only",
] as const satisfies readonly PostSearchReplies[];

// Flags stockés en base (post_flag) : "reported" n'en fait pas partie.
export const SEARCH_EXCLUDABLE_FLAGS = [
	"NFE",
	"AI",
	"joke",
	"misinformation",
	"spam",
	"suspicious",
	"suicide",
] as const satisfies readonly PostFlagType[];

// Regroupements proposés par l'interface
export const SEARCH_FLAG_GROUPS = {
	sensitive: ["NFE", "suicide", "spam", "misinformation", "suspicious"],
	ai: ["AI"],
} as const satisfies Record<string, readonly PostFlagType[]>;
