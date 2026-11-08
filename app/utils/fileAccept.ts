// app/utils/file-accept.ts
//
// Aide autour de l'attribut `accept` d'un <input type="file"> :
// l'attribut natif ne filtre pas le glisser-déposer, donc on revérifie nous-mêmes.

const MIME_LABELS: Record<string, string> = {
	"image/*": "Images",
	"video/*": "Vidéos",
	"audio/*": "Audio",
	"application/pdf": "PDF",
	"text/plain": "Texte",
};

export function parseAccept(accept?: string): string[] {
	return (accept ?? "")
		.split(",")
		.map((token) => token.trim().toLowerCase())
		.filter(Boolean);
}

export function matchesAccept(file: File, accept?: string): boolean {
	const tokens = parseAccept(accept);
	if (tokens.length === 0) return true;

	const name = file.name.toLowerCase();
	const type = file.type.toLowerCase();

	return tokens.some((token) => {
		if (token.startsWith(".")) return name.endsWith(token);
		if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
		return type === token;
	});
}

/** "image/png,image/jpeg" → "PNG, JPEG" ; "image/*" → "Images" */
export function describeAccept(accept?: string): string {
	const tokens = parseAccept(accept);
	if (tokens.length === 0) return "Tous les types de fichiers";

	const labels = tokens.map((token) => {
		if (MIME_LABELS[token]) return MIME_LABELS[token];
		if (token.startsWith(".")) return token.slice(1).toUpperCase();
		return (token.split("/")[1] ?? token).replace(/\+.*/, "").toUpperCase();
	});

	return [...new Set(labels)].join(", ");
}
