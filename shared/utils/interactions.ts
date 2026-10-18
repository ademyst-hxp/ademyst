import type { PostFlagType } from "~~/shared/models/interactions";


export const calculateRatingScore = (
	date: Date | string,
	content: string,
	level: number,
	stats: {
		reactions: Record<string, number>;
		answers: number;
	},
	flags: {
		[flag in PostFlagType]: boolean;
	},
): number => ratingScoreDetails(date, content, level, stats, flags).score;

export const ratingScoreDetails = (
	date: Date | string,
	content: string,
	level: number,
	stats: {
		reactions: Record<string, number>;
		answers: number;
	},
	flags: {
		[flag in PostFlagType]: boolean;
	},
): {
	score: number;
	dateMultiplier: number;
	lengthMultiplier: number;
	ethosMultiplier: number;
	reactionScore: number;
	flagMultiplier: number;
	repostScore: number;
} => {
	const dateValue = date instanceof Date ? date : new Date(date);
	const ageInDays =
		(Date.now() - dateValue.getTime()) / (1000 * 60 * 60 * 24);

	// Décroissance progressive : ~100% aujourd'hui,
	// ~50% après 7 jours, mais ne tombe jamais à zéro.
	const dateMultiplier = 1 / (1 + ageInDays / 7);

	// Un post très court est pénalisé, mais jamais shadow.
	const lengthMultiplier = 0.25 + 0.75 * Math.min(1, content.length / 300);

	const ethosMultiplier =
		level < 3
			? 0
			: [4, 6, 7, 8].includes(level)
				? 1.4
				: [5, 9].includes(level)
					? 5.5
					: 1;

	// Rendements décroissants sur les likes/réponses.
	const likes = stats.reactions.like || 0;
	const reposts = 0; // Pas encore implémenté, mais prévu pour le futur.

	const reactionScore = Math.log2(1 + likes) * 10;
	const repostScore = Math.log2(1 + reposts) * 6;

	const approvalScore = reactionScore + repostScore;

	// Flags négatifs : si un post est signalé pour des raisons graves, il est fortement pénalisé.
	let flagMultiplier = 1;

	if (flags.AI || flags.suspicious || flags.suicide || flags.reported) {
		flagMultiplier = 0.25;
	}

	if (flags.NFE || flags.misinformation || flags.spam) {
		flagMultiplier = 0;
	}

	const score =
		Math.sqrt(approvalScore) *
		ethosMultiplier *
		dateMultiplier *
		lengthMultiplier *
		flagMultiplier *
		10;

	return {
		score: Math.round(score * 100) / 100,
		dateMultiplier,
		lengthMultiplier,
		ethosMultiplier,
		flagMultiplier,
		reactionScore,
		repostScore,
	};
};
