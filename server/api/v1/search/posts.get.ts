import { useDb } from "~~/server/db";
import { attachments } from "~~/server/db/schema/drive";
import {
	hashtags,
	postReactions,
	posts,
	postsFlags,
	postsHashtags,
} from "~~/server/db/schema/interactions";
import { profiles } from "~~/server/db/schema/profiles";
import { blocks, follows } from "~~/server/db/schema/relations";
import {
	and,
	asc,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	isNotNull,
	isNull,
	lte,
	ne,
	notExists,
	or,
	sql,
} from "drizzle-orm";

import { getIdentity } from "~~/server/utils/auth";
import { retrieveSeveralCleanPosts } from "~~/server/utils/converters/interactions";
import {
	queryDate,
	queryEnum,
	queryEnumList,
	queryBoolean,
	queryInteger,
	queryPagination,
	queryText,
} from "~~/server/utils/helpers/filters";
import { containsPattern } from "~~/server/utils/helpers/search";
import {
	SEARCH_COUNT_MAX,
	SEARCH_EXCLUDABLE_FLAGS,
	SEARCH_FIELDS,
	SEARCH_MAX_OFFSET,
	SEARCH_MAX_PAGE_SIZE,
	SEARCH_PAGE_SIZE,
	SEARCH_QUERY_MAX_LENGTH,
	SEARCH_QUERY_MIN_LENGTH,
	SEARCH_REPLIES,
	SEARCH_SORTS,
} from "~~/shared/consts/search";

import type { SQL } from "drizzle-orm";
import type { Post } from "~~/shared/models/interactions";
import type { AttachmentType } from "~~/shared/models/drive";

/*
 * GET /api/v1/search/posts?q=…
 *
 * Une publication est trouvée si la requête (correspondance partielle, sans
 * tenir compte de la casse) apparaît dans :
 *   - son contenu                       (in=content)
 *   - le pseudo ou le nom affiché de son auteur   (in=author)
 *   - l'un de ses tags, avec ou sans "#"          (in=tags)
 * `in` limite la recherche à certains de ces champs (défaut : les trois).
 *
 * Filtres, tous optionnels et combinés avec ET :
 *   after / before          date de CRÉATION uniquement (jamais updatedAt), bornes incluses
 *   min_links / max_links   nombre de liens joints
 *   min_images / max_images nombre d'images jointes
 *   min_likes, min_answers  popularité
 *   replies                 include (défaut) | exclude | only
 *   from                    pseudo exact de l'auteur
 *   following               true : uniquement les comptes que je suis (connecté)
 *   exclude_flags           flags à écarter, ex. NFE,spam
 *   sort                    recent (défaut) | oldest | top (likes)
 *   limit, offset           pagination (offset = `next` de la page précédente)
 */

// Nombre maximum de lots lus pour remplir une page : certains résultats sont
// écartés après coup (visibilité, blocages), la page peut donc demander
// plusieurs lots avant d'être pleine.
const MAX_ROUNDS = 4;

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const identity = await getIdentity(event);

	/* ----------------------------- Paramètres ----------------------------- */

	const q = queryText(event, "q", {
		minLength: SEARCH_QUERY_MIN_LENGTH,
		maxLength: SEARCH_QUERY_MAX_LENGTH,
	});

	if (!q) {
		throw createError({
			statusCode: 400,
			statusMessage: `Missing or too short 'q' (minimum ${SEARCH_QUERY_MIN_LENGTH} characters)`,
		});
	}

	const fields = queryEnumList(event, "in", SEARCH_FIELDS) ?? [
		...SEARCH_FIELDS,
	];

	const after = queryDate(event, "after", "start");
	const before = queryDate(event, "before", "end");

	if (after && before && after > before) {
		throw createError({
			statusCode: 400,
			statusMessage: "'after' must not be later than 'before'",
		});
	}

	const count = { min: 0, max: SEARCH_COUNT_MAX };

	const minLinks = queryInteger(event, "min_links", count);
	const maxLinks = queryInteger(event, "max_links", count);
	const minImages = queryInteger(event, "min_images", count);
	const maxImages = queryInteger(event, "max_images", count);
	const minLikes = queryInteger(event, "min_likes", count);
	const minAnswers = queryInteger(event, "min_answers", count);

	for (const [low, high, name] of [
		[minLinks, maxLinks, "links"],
		[minImages, maxImages, "images"],
	] as const) {
		if (low !== undefined && high !== undefined && low > high) {
			throw createError({
				statusCode: 400,
				statusMessage: `'min_${name}' must not exceed 'max_${name}'`,
			});
		}
	}

	const replies = queryEnum(event, "replies", SEARCH_REPLIES) ?? "include";
	const sort = queryEnum(event, "sort", SEARCH_SORTS) ?? "recent";
	const excludedFlags = queryEnumList(
		event,
		"exclude_flags",
		SEARCH_EXCLUDABLE_FLAGS,
	);

	const from = queryText(event, "from", { maxLength: 17 })?.replace(
		/^@/,
		"",
	);

	const onlyFollowing = queryBoolean(event, "following") ?? false;

	if (onlyFollowing && !identity) {
		throw createError({
			statusCode: 401,
			statusMessage: "Authentication required",
		});
	}

	const { limit, offset } = queryPagination(event, {
		defaultLimit: SEARCH_PAGE_SIZE,
		maxLimit: SEARCH_MAX_PAGE_SIZE,
	});

	/* ------------------------------ Correspondance ------------------------------ */

	const pattern = containsPattern(q);

	// Un tag est enregistré sans "#" : "#chat" doit retrouver "chat".
	const tagTerm = q.replace(/^#+/, "");
	const tagPattern = containsPattern(tagTerm);

	const wantContent = fields.includes("content");
	const wantAuthor = fields.includes("author");
	const wantTags = fields.includes("tags") && tagTerm.length > 0;

	// Chaque branche s'appuie sur son propre index (trigrammes sur le contenu,
	// le pseudo, le nom affiché et le tag). Elles sont réunies par UNION plutôt
	// que par un OR sur trois tables, qu'aucun index ne pourrait servir.
	const branches: SQL[] = [];

	if (wantContent) {
		branches.push(
			sql`select ${posts.id} from ${posts} where ${ilike(posts.content, pattern)}`,
		);
	}

	if (wantAuthor) {
		branches.push(
			sql`select ${posts.id} from ${posts} inner join ${profiles} on ${eq(posts.profileId, profiles.id)} where ${or(ilike(profiles.name, pattern), ilike(profiles.displayName, pattern))}`,
		);
	}

	if (wantTags) {
		const matchingTags = db
			.select({ tag: hashtags.tag })
			.from(hashtags)
			.where(ilike(hashtags.tag, tagPattern));

		branches.push(
			sql`select ${postsHashtags.postId} from ${postsHashtags} where ${inArray(postsHashtags.hashtag, matchingTags)}`,
		);
	}

	// Rien à chercher (ex. `in=tags` avec q="#") : page vide, pas d'erreur.
	if (branches.length === 0) {
		return { status: "ok", query: q, posts: [], next: offset, hasNext: false };
	}

	/* -------------------------------- Filtres -------------------------------- */

	const countAttachments = (type: AttachmentType) =>
		sql<number>`(select count(*) from ${attachments} where ${attachments.postId} = ${posts.id} and ${attachments.type} = ${type})`;

	const likeCount = sql<number>`(select count(*) from ${postReactions} where ${postReactions.postId} = ${posts.id} and ${postReactions.reaction} = 'like')`;

	const answerCount = sql<number>`(select count(*) from ${posts} as answers where answers.parent_id = ${posts.id})`;

	const conditions: (SQL | undefined)[] = [
		sql`${posts.id} in (${sql.join(branches, sql` union `)})`,

		// Les publications privées ne sont visibles que de leur auteur.
		identity
			? or(
					ne(posts.visibility, "me"),
					eq(posts.profileId, identity.profileId),
				)
			: ne(posts.visibility, "me"),

		// Aucun résultat entre deux comptes dont l'un a bloqué l'autre.
		identity
			? notExists(
					db
						.select({ one: sql`1` })
						.from(blocks)
						.where(
							or(
								and(
									eq(blocks.blockerId, identity.profileId),
									eq(blocks.blockedId, posts.profileId),
								),
								and(
									eq(blocks.blockerId, posts.profileId),
									eq(blocks.blockedId, identity.profileId),
								),
							),
						),
				)
			: undefined,

		// Dates de création uniquement : updatedAt n'intervient jamais.
		after ? gte(posts.createdAt, after) : undefined,
		before ? lte(posts.createdAt, before) : undefined,

		minLinks !== undefined
			? sql`${countAttachments("link")} >= ${minLinks}`
			: undefined,
		maxLinks !== undefined
			? sql`${countAttachments("link")} <= ${maxLinks}`
			: undefined,
		minImages !== undefined
			? sql`${countAttachments("image")} >= ${minImages}`
			: undefined,
		maxImages !== undefined
			? sql`${countAttachments("image")} <= ${maxImages}`
			: undefined,

		minLikes !== undefined ? sql`${likeCount} >= ${minLikes}` : undefined,
		minAnswers !== undefined
			? sql`${answerCount} >= ${minAnswers}`
			: undefined,

		replies === "exclude" ? isNull(posts.parentId) : undefined,
		replies === "only" ? isNotNull(posts.parentId) : undefined,

		from ? eq(profiles.name, from) : undefined,

		onlyFollowing && identity
			? inArray(
					posts.profileId,
					db
						.select({ id: follows.followingId })
						.from(follows)
						.where(eq(follows.followerId, identity.profileId)),
				)
			: undefined,

		excludedFlags
			? notExists(
					db
						.select({ one: sql`1` })
						.from(postsFlags)
						.where(
							and(
								eq(postsFlags.postId, posts.id),
								inArray(postsFlags.type, excludedFlags),
							),
						),
				)
			: undefined,
	];

	// Tri stable : l'identifiant départage les égalités, sinon deux pages
	// successives pourraient répéter ou sauter une publication.
	const orderBy =
		sort === "oldest"
			? [asc(posts.createdAt), asc(posts.id)]
			: sort === "top"
				? [desc(likeCount), desc(posts.createdAt), desc(posts.id)]
				: [desc(posts.createdAt), desc(posts.id)];

	/*
	 * Le nom affiché d'un profil peut être masqué par ses réglages de
	 * confidentialité. Une publication trouvée UNIQUEMENT grâce à ce nom
	 * révélerait donc une information cachée : on la repère ici pour l'écarter
	 * si le profil nettoyé n'expose pas son nom affiché.
	 */
	const matchedOnlyByDisplayName = wantAuthor
		? sql<boolean>`(coalesce(${ilike(profiles.displayName, pattern)}, false) and not (${or(
				wantContent ? ilike(posts.content, pattern) : sql`false`,
				ilike(profiles.name, pattern),
				wantTags
					? sql`exists (select 1 from ${postsHashtags} where ${postsHashtags.postId} = ${posts.id} and ${ilike(postsHashtags.hashtag, tagPattern)})`
					: sql`false`,
			)}))`
		: sql<boolean>`false`;

	/* ------------------------------ Lecture ------------------------------ */

	const found: Post[] = [];

	// Position dans les résultats BRUTS (avant écartement) : c'est elle que le
	// client renvoie comme `offset`, pas le nombre de résultats affichés.
	let next = offset;
	let hasNext = next < SEARCH_MAX_OFFSET;

	rounds: for (let round = 0; round < MAX_ROUNDS && hasNext; round++) {
		const rows = await db
			.select({
				post: posts,
				displayNameOnly: matchedOnlyByDisplayName.mapWith(Boolean),
			})
			.from(posts)
			.innerJoin(profiles, eq(posts.profileId, profiles.id))
			.where(and(...conditions))
			.orderBy(...orderBy)
			.limit(limit)
			.offset(next);

		const lastBatch = rows.length < limit;

		const cleaned = await retrieveSeveralCleanPosts(
			event,
			identity,
			rows.map((row) => row.post),
			true,
		);

		const byId = new Map(cleaned.map((post) => [post.id, post]));

		for (const [index, row] of rows.entries()) {
			next++;

			const post = byId.get(row.post.id);

			if (post && isSearchable(post, row.displayNameOnly)) {
				found.push(post);
			}

			if (found.length >= limit) {
				hasNext =
					next < SEARCH_MAX_OFFSET &&
					!(lastBatch && index === rows.length - 1);

				break rounds;
			}
		}

		if (lastBatch) hasNext = false;
		if (next >= SEARCH_MAX_OFFSET) hasNext = false;
	}

	return {
		status: "ok",
		query: q,
		posts: found,
		next,
		hasNext,
	};
});

// Règles appliquées une fois la publication "nettoyée" (privacy, niveaux…).
function isSearchable(post: Post, displayNameOnly: boolean): boolean {
	const { relationships, level } = post.profile;

	// Compte que j'ai bloqué : la publication n'a rien à faire dans les résultats.
	if (relationships.blocking) return false;

	// Comptes restreints ou shadowban (niveau < 3) : invisibles du grand public,
	// sauf pour leur propriétaire et leurs abonnés.
	if (level < 3 && !relationships.me && !relationships.following) {
		return false;
	}

	// Trouvée par un nom affiché que ce profil ne montre pas à ce lecteur.
	if (displayNameOnly && post.profile.displayName === null) return false;

	return true;
}
