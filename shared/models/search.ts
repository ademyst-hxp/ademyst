import type { Post, PostFlagType as AnyPostFlagType } from "./interactions";

// Flags réellement enregistrés pour une publication (sans "reported", calculé)
export type PostFlagType = Exclude<AnyPostFlagType, "reported">;

// Où chercher la requête
export type PostSearchField = "content" | "author" | "tags";

export type PostSearchSort =
	| "recent" // plus récentes d'abord
	| "oldest" // plus anciennes d'abord
	| "top"; // plus aimées d'abord

export type PostSearchReplies =
	| "include" // publications et réponses
	| "exclude" // publications uniquement
	| "only"; // réponses uniquement

// Paramètres de GET /api/v1/search/posts (tous en chaîne dans l'URL)
export type PostSearchParams = {
	q: string;
	in?: string; // "content,author,tags" (défaut : les trois)
	after?: string; // YYYY-MM-DD ou ISO 8601 (inclus, date de création)
	before?: string; // YYYY-MM-DD ou ISO 8601 (inclus, date de création)
	min_links?: number;
	max_links?: number;
	min_images?: number;
	max_images?: number;
	min_likes?: number;
	min_answers?: number;
	replies?: PostSearchReplies;
	from?: string; // pseudo exact de l'auteur
	following?: boolean; // uniquement les comptes que je suis
	exclude_flags?: string; // "NFE,spam,..."
	sort?: PostSearchSort;
	limit?: number;
	offset?: number;
};

export type PostSearchResponse = {
	status: "ok";
	query: string;
	posts: Post[];
	// Offset à envoyer pour la page suivante (position dans les résultats bruts)
	next: number;
	hasNext: boolean;
};
