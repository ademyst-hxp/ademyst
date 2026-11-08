<script setup lang="ts">
// app/components/base/Textarea.vue  —  zone de texte enrichie (Markdown)
import type { Component } from "vue";
import {
	BoldIcon,
	ChatBubbleBottomCenterTextIcon,
	CodeBracketIcon,
	ItalicIcon,
	LinkIcon,
	ListBulletIcon,
	NumberedListIcon,
	StrikethroughIcon,
	UnderlineIcon,
} from "@heroicons/vue/24/outline";

import type {
	TextareaAction,
	TextareaActionContext,
	TextareaToolId,
} from "~/utils/textarea";
import {
	MARKDOWN_TOOLS,
	MARKDOWN_TOOL_IDS,
	wrapEdit,
	type MarkdownTool,
	type TextEdit,
	type TextSelection,
} from "~/utils/textEdit";

import CharCounter from "~/components/base/CharCounter.vue";
import FieldWrapper from "~/components/base/FieldWrapper.vue";

const props = withDefaults(
	defineProps<{
		modelValue?: string;
		label?: string;
		placeholder?: string;
		disabled?: boolean;
		invalid?: boolean;
		required?: boolean;
		minLength?: number;
		maxLength?: number;
		/** Boutons de la barre du bas (alignés à gauche) */
		actions?: TextareaAction[];
		/** Outils de mise en forme affichés en haut (tous par défaut) */
		tools?: TextareaToolId[];
		id?: string;
	}>(),
	{
		modelValue: "",
		placeholder: "",
		disabled: false,
		invalid: false,
		required: false,
		minLength: undefined,
		maxLength: undefined,
		actions: () => [],
		tools: () => [...MARKDOWN_TOOL_IDS],
		id: undefined,
	},
);

const emit = defineEmits<{
	(e: "update:modelValue", value: string): void;
	(e: "focus", event: FocusEvent): void;
	(e: "blur", event: FocusEvent): void;
	/** Ctrl / ⌘ + Entrée (Entrée seule fait un retour à la ligne) */
	(e: "enter", value: string): void;
}>();

const TOOL_ICONS: Record<TextareaToolId, Component> = {
	bold: BoldIcon,
	italic: ItalicIcon,
	underline: UnderlineIcon,
	strike: StrikethroughIcon,
	link: LinkIcon,
	code: CodeBracketIcon,
	quote: ChatBubbleBottomCenterTextIcon,
	bulletList: ListBulletIcon,
	numberedList: NumberedListIcon,
};

const generatedId = useId();
const textareaId = computed(() => props.id ?? generatedId);
const textareaEl = ref<HTMLTextAreaElement | null>(null);

const visibleTools = computed(() =>
	MARKDOWN_TOOLS.filter((tool) => props.tools.includes(tool.id)),
);

// "⌘" sur Apple, "Ctrl" ailleurs (défini après le montage pour éviter un écart SSR)
const modKey = ref("Ctrl");
onMounted(() => {
	if (/Mac|iPhone|iPad/.test(navigator.platform)) modKey.value = "⌘";
});

const toolTitle = (tool: MarkdownTool) =>
	tool.shortcut
		? `${tool.label} (${modKey.value}+${tool.shortcut.toUpperCase()})`
		: tool.label;

/* ------------------------------ Validation ------------------------------- */

const touched = ref(false);

const counter = useTextCounter(
	() => props.modelValue.length,
	() => ({ min: props.minLength, max: props.maxLength }),
);

const hasLimits = computed(
	() => props.minLength !== undefined || props.maxLength !== undefined,
);

const messages = computed(() => {
	const list: string[] = [];

	if (touched.value && props.required && !props.modelValue) {
		list.push("Ce champ est obligatoire.");
	}

	if (touched.value && props.modelValue && counter.value.isShort) {
		list.push(`Minimum ${props.minLength} caractères.`);
	}

	return list;
});

const hasError = computed(
	() => props.invalid || counter.value.isOver || messages.value.length > 0,
);

const containerClass = computed(() =>
	hasError.value
		? "outline-danger"
		: "outline-transparent focus-within:outline-input-focus-ring",
);

/* ------------------------------- Édition --------------------------------- */

const currentSelection = (): TextSelection | null => {
	const el = textareaEl.value;
	if (!el) return null;
	return { value: el.value, start: el.selectionStart, end: el.selectionEnd };
};

// On passe par execCommand quand c'est possible : l'historique natif (Ctrl+Z)
// continue alors de fonctionner. Repli sur setRangeText sinon.
const applyEdit = (edit: TextEdit) => {
	const el = textareaEl.value;
	if (!el || props.disabled) return;

	el.focus();
	el.setSelectionRange(edit.from, edit.to);

	let done = false;
	try {
		done =
			edit.insert === ""
				? edit.from !== edit.to && document.execCommand("delete")
				: document.execCommand("insertText", false, edit.insert);
	} catch {
		done = false;
	}

	if (!done) {
		el.setRangeText(edit.insert, edit.from, edit.to, "end");
		el.dispatchEvent(new Event("input", { bubbles: true }));
	}

	el.setSelectionRange(edit.selectionStart, edit.selectionEnd);
};

const runTool = (tool: MarkdownTool) => {
	const selection = currentSelection();
	if (selection) applyEdit(tool.run(selection));
};

const runAction = async (action: TextareaAction) => {
	const el = textareaEl.value;
	if (!el || action.disabled || props.disabled) return;

	const { selectionStart: start, selectionEnd: end } = el;

	const context: TextareaActionContext = {
		value: el.value,
		selection: { start, end, text: el.value.slice(start, end) },
		insert: (text) => {
			const selection = currentSelection();
			if (!selection) return;
			const cursor = selection.start + text.length;
			applyEdit({
				from: selection.start,
				to: selection.end,
				insert: text,
				selectionStart: cursor,
				selectionEnd: cursor,
			});
		},
		wrap: (before, after = before) => {
			const selection = currentSelection();
			if (selection) applyEdit(wrapEdit(selection, before, after));
		},
		focus: () => el.focus(),
	};

	await action.handler(context);
};

/* ------------------------------ Événements ------------------------------- */

const onInput = (event: Event) => {
	emit("update:modelValue", (event.target as HTMLTextAreaElement).value);
};

const onFocus = (event: FocusEvent) => {
	touched.value = false;
	emit("focus", event);
};

const onBlur = (event: FocusEvent) => {
	touched.value = true;
	emit("blur", event);
};

const onKeydown = (event: KeyboardEvent) => {
	if (!(event.ctrlKey || event.metaKey) || event.altKey) return;

	if (event.key === "Enter") {
		event.preventDefault();
		emit("enter", props.modelValue);
		return;
	}

	const key = event.key.toLowerCase();
	const tool = visibleTools.value.find((item: any) => item.shortcut === key);

	if (tool) {
		event.preventDefault();
		runTool(tool);
	}
};

defineExpose({ focus: () => textareaEl.value?.focus() });
</script>
<template>
	<FieldWrapper
		:label="label"
		:required="required"
		:for-id="textareaId"
		:messages="messages"
	>
		<div
			class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-input text-input-text outline-2 transition"
			:class="[containerClass, disabled && 'cursor-not-allowed opacity-50']"
		>
			<!-- Haut : mise en forme + compteur -->
			<div
				class="flex shrink-0 items-center gap-2 border-b border-surface-border pr-3"
			>
				<div
					class="flex min-w-0 grow items-center gap-0.5 overflow-x-auto p-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
					role="toolbar"
					aria-label="Mise en forme"
				>
					<button
						v-for="tool in visibleTools"
						:key="tool.id"
						type="button"
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-input-text disabled:cursor-not-allowed disabled:opacity-40 sm:h-8 sm:w-8"
						:title="toolTitle(tool)"
						:aria-label="tool.label"
						:disabled="disabled"
						@mousedown.prevent
						@click="runTool(tool)"
					>
						<component :is="TOOL_ICONS[tool.id]" class="h-5 w-5" />
					</button>
				</div>

				<CharCounter
					v-if="hasLimits"
					:length="modelValue.length"
					:min="minLength"
					:max="maxLength"
				/>
			</div>

			<!-- Zone de saisie (16 px minimum : évite le zoom automatique d'iOS) -->
			<textarea
				:id="textareaId"
				ref="textareaEl"
				class="min-h-32 w-full min-w-0 flex-1 resize-none bg-transparent px-4 py-3 text-base outline-none"
				:value="modelValue"
				:placeholder="placeholder"
				:disabled="disabled"
				@input="onInput"
				@focus="onFocus"
				@blur="onBlur"
				@keydown="onKeydown"
			/>

			<!-- Bas : actions à gauche, mention Markdown à droite -->
			<div
				class="flex shrink-0 items-center gap-2 border-t border-surface-border pr-3"
			>
				<div
					class="flex min-w-0 grow items-center gap-0.5 overflow-x-auto p-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
				>
					<button
						v-for="action in actions"
						:key="action.label"
						type="button"
						class="flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-input-text disabled:cursor-not-allowed disabled:opacity-40 sm:h-8"
						:title="action.label"
						:aria-label="action.label"
						:disabled="disabled || action.disabled"
						@mousedown.prevent
						@click="runAction(action)"
					>
						<component :is="action.icon" class="h-5 w-5 shrink-0" />
						<!-- Sur mobile : icône seule pour tenir sur une ligne -->
						<span class="max-sm:sr-only">{{ action.label }}</span>
					</button>
				</div>

				<span
					class="shrink-0 py-2 text-xs font-medium text-muted"
					title="La mise en forme Markdown est prise en charge"
				>
					Markdown
				</span>
			</div>
		</div>
	</FieldWrapper>
</template>
