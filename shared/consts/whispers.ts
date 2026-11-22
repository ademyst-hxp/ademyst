/*
 * Palette des pensées (le sélecteur de couleur de /discover et les Quêtes de
 * Noël lisent la même liste : une couleur ajoutée ici apparaît dans les deux).
 *
 * Chaque entrée est une paire fond / texte. L'utilisateur peut inverser la
 * paire (fond <-> texte) : une pensée est donc de la teinte `id` quand sa
 * couleur de fond vaut le `background` OU le `text` de l'entrée.
 */
export const WHISPER_COLORS = [
	{ id: "red", background: "#fbd1d1", text: "#eb3030" },
	{ id: "orange", background: "#ffeacf", text: "#ffa732" },
	{ id: "green", background: "#def8ea", text: "#2ed07c" },
	{ id: "cyan", background: "#dbf7f8", text: "#29ced2" },
	{ id: "blue", background: "#d8e0ff", text: "#2757ff" },
	{ id: "purple", background: "#f2d8ff", text: "#b627ff" },
	{ id: "pink", background: "#ffd8fb", text: "#ff27e8" },
	// Utilisée par la quête du 21/12 (pensée dorée)
	{ id: "gold", background: "#d3ad60", text: "#df101f" },
] as const;

export type WhisperHue = (typeof WHISPER_COLORS)[number]["id"];

/** Teinte d'une pensée d'après sa couleur de fond ; null si hors palette. */
export function getWhisperHue(
	color: string | null | undefined,
): WhisperHue | null {
	if (!color) return null;

	const value = color.toLowerCase();

	const entry = WHISPER_COLORS.find(
		(candidate) => candidate.background === value || candidate.text === value,
	);

	return entry?.id ?? null;
}
