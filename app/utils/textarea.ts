// shared/models/textarea.ts
import type { Component } from "vue";

export interface TextareaSelection {
	start: number;
	end: number;
	text: string;
}

/** Contexte transmis au handler d'une action personnalisée. */
export interface TextareaActionContext {
	/** Contenu actuel du champ. */
	value: string;
	/** Sélection au moment du clic. */
	selection: TextareaSelection;
	/** Remplace la sélection (ou insère au curseur) par `text`. */
	insert: (text: string) => void;
	/** Entoure la sélection (ou retire l'entourage s'il est déjà présent). */
	wrap: (before: string, after?: string) => void;
	/** Redonne le focus au champ. */
	focus: () => void;
}

/** Bouton de la barre d'actions (en bas du Textarea enrichi). */
export interface TextareaAction {
	label: string;
	icon: Component;
	handler: (context: TextareaActionContext) => void | Promise<void>;
	disabled?: boolean;
}

export type TextareaToolId =
	| "bold"
	| "italic"
	| "underline"
	| "strike"
	| "link"
	| "code"
	| "quote"
	| "bulletList"
	| "numberedList";
