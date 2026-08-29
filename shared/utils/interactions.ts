export const calculateRatingScore = (
	date: Date,
	content: string,
	level: number,
	stats: {
		reactions: Record<string, number>;
		answers: number;
	},
	
): number => {
	const ageInDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);

	// Décroissance progressive : ~100% aujourd'hui,
	// ~50% après 7 jours, mais ne tombe jamais à zéro.
	const dateMultiplier = 1 / (1 + ageInDays / 7);

	// Un post très court est pénalisé, mais jamais shadow.
	const lengthMultiplier = 0.25 + 0.75 * Math.min(1, content.length / 300);

	const ethosMultiplier = [4, 6, 7, 8].includes(level)
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

	const score =
		Math.sqrt(approvalScore) *
		ethosMultiplier *
		dateMultiplier *
		lengthMultiplier *
		10;

	return Math.round(score * 100) / 100;
};
