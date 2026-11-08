// app/utils/text-edit.ts
//
// Édition de texte "pure" : chaque fonction reçoit l'état d'une sélection et
// renvoie un TextEdit (remplacement + nouvelle sélection). Aucune dépendance au
// DOM, donc facile à tester. Le composant applique ensuite le TextEdit.
import type { TextareaToolId } from "~~/shared/models/textarea";

export interface TextSelection {
	value: string;
	start: number;
	end: number;
}

export interface TextEdit {
	/** Zone remplacée dans le texte d'origine : [from, to[ */
	from: number;
	to: number;
	insert: string;
	/** Sélection à restaurer (positions dans le NOUVEAU texte). */
	selectionStart: number;
	selectionEnd: number;
}

export function applyEditToString(value: string, edit: TextEdit): string {
	return value.slice(0, edit.from) + edit.insert + value.slice(edit.to);
}

/**
 * Entoure la sélection avec `before`/`after`.
 * Si l'entourage est déjà là (autour ou dans la sélection), il est retiré.
 */
export function wrapEdit(
	{ value, start, end }: TextSelection,
	before: string,
	after: string = before,
	placeholder = "",
): TextEdit {
	const selected = value.slice(start, end);

	// 1. Marqueurs juste autour de la sélection → on les retire
	if (
		start >= before.length &&
		value.slice(start - before.length, start) === before &&
		value.slice(end, end + after.length) === after
	) {
		return {
			from: start - before.length,
			to: end + after.length,
			insert: selected,
			selectionStart: start - before.length,
			selectionEnd: end - before.length,
		};
	}

	// 2. Marqueurs inclus dans la sélection → on les retire
	if (
		selected.length >= before.length + after.length &&
		selected.startsWith(before) &&
		selected.endsWith(after)
	) {
		const inner = selected.slice(
			before.length,
			selected.length - after.length,
		);
		return {
			from: start,
			to: end,
			insert: inner,
			selectionStart: start,
			selectionEnd: start + inner.length,
		};
	}

	// 3. Sinon on entoure (curseur placé entre les marqueurs si rien n'est sélectionné)
	const text = selected || placeholder;
	return {
		from: start,
		to: end,
		insert: before + text + after,
		selectionStart: start + before.length,
		selectionEnd: start + before.length + text.length,
	};
}

type LineKind = "quote" | "bullet" | "numbered";

const LINE_PATTERNS: Record<LineKind, RegExp> = {
	quote: /^>\s?/,
	bullet: /^[-*+]\s+/,
	numbered: /^\d+[.)]\s+/,
};

const LINE_PREFIXES: Record<LineKind, (index: number) => string> = {
	quote: () => "> ",
	bullet: () => "- ",
	numbered: (index) => `${index + 1}. `,
};

/** Ajoute (ou retire) un préfixe sur chaque ligne touchée par la sélection. */
export function linePrefixEdit(
	{ value, start, end }: TextSelection,
	kind: LineKind,
): TextEdit {
	const pattern = LINE_PATTERNS[kind];

	const lineStart = start === 0 ? 0 : value.lastIndexOf("\n", start - 1) + 1;
	// Une sélection qui finit juste après un saut de ligne n'inclut pas la ligne suivante
	const effectiveEnd = end > start && value[end - 1] === "\n" ? end - 1 : end;
	const found = value.indexOf("\n", effectiveEnd);
	const lineEnd = found === -1 ? value.length : found;

	const lines = value.slice(lineStart, lineEnd).split("\n");
	const filled = lines.filter((line) => line.trim().length > 0);
	const allPrefixed =
		filled.length > 0 && filled.every((line) => pattern.test(line));

	let counter = 0;
	const next = lines.map((line) => {
		if (allPrefixed) return line.replace(pattern, "");
		if (!line.trim()) return line;
		return LINE_PREFIXES[kind](counter++) + line.replace(pattern, "");
	});

	const insert = next.join("\n");

	if (start === end) {
		const shift = next[0]!.length - lines[0]!.length;
		const cursor = Math.max(lineStart, start + shift);
		return {
			from: lineStart,
			to: lineEnd,
			insert,
			selectionStart: cursor,
			selectionEnd: cursor,
		};
	}

	return {
		from: lineStart,
		to: lineEnd,
		insert,
		selectionStart: lineStart,
		selectionEnd: lineStart + insert.length,
	};
}

/** Insère un lien Markdown, sans fenêtre de dialogue : la partie à remplir est sélectionnée. */
export function linkEdit({ value, start, end }: TextSelection): TextEdit {
	const selected = value.slice(start, end);

	// Une URL est sélectionnée → elle devient la cible, on place le curseur dans les crochets
	if (/^https?:\/\/\S+$/i.test(selected)) {
		return {
			from: start,
			to: end,
			insert: `[](${selected})`,
			selectionStart: start + 1,
			selectionEnd: start + 1,
		};
	}

	const url = "https://";

	// Du texte est sélectionné → on sélectionne l'URL à saisir
	if (selected) {
		const urlStart = start + selected.length + 3; // "[" + texte + "]("
		return {
			from: start,
			to: end,
			insert: `[${selected}](${url})`,
			selectionStart: urlStart,
			selectionEnd: urlStart + url.length,
		};
	}

	// Rien n'est sélectionné → on sélectionne le texte du lien à saisir
	const placeholder = "texte";
	return {
		from: start,
		to: end,
		insert: `[${placeholder}](${url})`,
		selectionStart: start + 1,
		selectionEnd: start + 1 + placeholder.length,
	};
}

/** Code en ligne, ou bloc de code si la sélection est sur plusieurs lignes. */
export function codeEdit(selection: TextSelection): TextEdit {
	const selected = selection.value.slice(selection.start, selection.end);
	return selected.includes("\n")
		? wrapEdit(selection, "```\n", "\n```")
		: wrapEdit(selection, "`");
}

/* -------------------------------------------------------------------------- */
/*  Outils de la barre de mise en forme                                       */
/* -------------------------------------------------------------------------- */

export interface MarkdownTool {
	id: TextareaToolId;
	label: string;
	/** Touche utilisée avec Ctrl / ⌘ */
	shortcut?: string;
	run: (selection: TextSelection) => TextEdit;
}

export const MARKDOWN_TOOLS: MarkdownTool[] = [
	{ id: "bold", label: "Gras", shortcut: "b", run: (s) => wrapEdit(s, "**") },
	{
		id: "italic",
		label: "Italique",
		shortcut: "i",
		// "_" et non "*" pour ne pas entrer en conflit avec le gras ("**")
		run: (s) => wrapEdit(s, "_"),
	},
	{
		id: "underline",
		label: "Souligné",
		shortcut: "u",
		// Le Markdown n'a pas de souligné : on passe par la balise HTML <u>
		run: (s) => wrapEdit(s, "<u>", "</u>"),
	},
	{ id: "strike", label: "Barré", run: (s) => wrapEdit(s, "~~") },
	{ id: "link", label: "Lien", shortcut: "k", run: linkEdit },
	{ id: "code", label: "Code", run: codeEdit },
	{ id: "quote", label: "Citation", run: (s) => linePrefixEdit(s, "quote") },
	{
		id: "bulletList",
		label: "Liste à puces",
		run: (s) => linePrefixEdit(s, "bullet"),
	},
	{
		id: "numberedList",
		label: "Liste numérotée",
		run: (s) => linePrefixEdit(s, "numbered"),
	},
];

export const MARKDOWN_TOOL_IDS = MARKDOWN_TOOLS.map((tool) => tool.id);
