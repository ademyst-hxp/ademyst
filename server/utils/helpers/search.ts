/*
 * Outils de la recherche partielle (LIKE / ILIKE).
 */

// Échappe les caractères spéciaux de LIKE (\ % _) : ils sont cherchés tels quels.
export const escapeLike = (value: string): string =>
	value.replace(/[\\%_]/g, (char) => `\\${char}`);

// Motif « contient » : "%valeur%"
export const containsPattern = (value: string): string =>
	`%${escapeLike(value)}%`;
