<script setup lang="ts">
// app/components/base/Input.vue
import type { Component } from "vue";
import { EyeIcon, EyeSlashIcon } from "@heroicons/vue/24/solid";

import type { TextareaAction, TextareaToolId } from "~/utils/textarea";
import { describeAccept } from "~/utils/fileAccept";

import CharCounter from "~/components/base/CharCounter.vue";
import FieldWrapper from "~/components/base/FieldWrapper.vue";
import InputFile from "~/components/base/InputFile.vue";
import RichTextarea from "~/components/base/Textarea.vue";

type InputValue = string | number | boolean | Date | File | null;

const props = withDefaults(
	defineProps<{
		label?: string;
		icon?: Component;
		modelValue?: InputValue;
		type?: string;
		size?: "small" | "medium" | "large";
		placeholder?: string;
		validate?: RegExp;
		disabled?: boolean;
		invalid?: boolean;
		required?: boolean;
		accept?: string;
		/** Bornes d'un champ numérique */
		min?: number;
		max?: number;
		/** Bornes de longueur d'un champ texte (affichent un compteur) */
		minLength?: number;
		maxLength?: number;
		/** type="textarea" uniquement : barre d'outils Markdown + actions */
		rich?: boolean;
		actions?: TextareaAction[];
		tools?: TextareaToolId[];
	}>(),
	{
		modelValue: "",
		type: "text",
		size: "medium",
		placeholder: "",
		disabled: false,
		invalid: false,
		required: false,
		min: undefined,
		max: undefined,
		minLength: undefined,
		maxLength: undefined,
		rich: false,
		actions: () => [],
		tools: undefined,
	},
);

const emit = defineEmits<{
	(e: "update:modelValue", value: InputValue): void;
	(e: "focus", event: FocusEvent): void;
	(e: "blur", event: FocusEvent): void;
	(e: "enter", value: string): void;
}>();

const slots = useSlots();
const fieldId = useId();

/* -------------------------------------------------------------------------- */
/*  État et validation                                                        */
/* -------------------------------------------------------------------------- */

const COUNTABLE_TYPES = new Set([
	"text",
	"password",
	"email",
	"url",
	"tel",
	"search",
	"textarea",
]);

const focused = ref(false);
const valid = ref(true);
const missing = ref(false);
const rejectedFile = ref(false);
const isPwdVisible = ref(false);

const isTextarea = computed(() => props.type === "textarea");

const hasValue = computed(() => {
	const value = props.modelValue;
	return (
		value !== null && value !== undefined && value !== "" && value !== false
	);
});

const textValue = computed(() =>
	typeof props.modelValue === "string" ? props.modelValue : "",
);

const hasLimits = computed(
	() =>
		COUNTABLE_TYPES.has(props.type) &&
		(props.minLength !== undefined || props.maxLength !== undefined),
);

const counter = useTextCounter(
	() => textValue.value.length,
	() => ({ min: props.minLength, max: props.maxLength }),
);

const rangeMessage = computed(() => {
	if (props.type !== "number" || !hasValue.value) return null;

	const value = Number(props.modelValue);
	if (isNaN(value)) return null;

	const { min, max } = props;
	const tooLow = min !== undefined && value < min;
	const tooHigh = max !== undefined && value > max;
	if (!tooLow && !tooHigh) return null;

	if (min !== undefined && max !== undefined) {
		return `Ce champ doit être compris entre ${min} et ${max}.`;
	}
	return min !== undefined
		? `Ce champ doit être supérieur à ${min}.`
		: `Ce champ doit être inférieur à ${max}.`;
});

const isValid = computed(() => {
	if (props.invalid) return false;
	if (props.required && !hasValue.value) return false;
	if (!hasValue.value) return true;

	if (props.validate && !props.validate.test(String(props.modelValue))) {
		return false;
	}

	if (props.type === "number") {
		if (isNaN(Number(props.modelValue)) || rangeMessage.value) return false;
	}

	if (hasLimits.value && (counter.value.isShort || counter.value.isOver)) {
		return false;
	}

	return true;
});

const validateNow = () => {
	valid.value = !hasValue.value || isValid.value;
	missing.value = props.required && !hasValue.value;
};

const messages = computed(() => {
	const list: string[] = [];

	if (missing.value) list.push("Ce champ est obligatoire.");
	if (!valid.value && rangeMessage.value) list.push(rangeMessage.value);

	if (!valid.value && hasLimits.value && counter.value.isShort) {
		list.push(`Minimum ${props.minLength} caractères.`);
	}

	if (rejectedFile.value) {
		list.push(`Type de fichier refusé (${describeAccept(props.accept)}).`);
	}

	return list;
});

// Le slot #error (ou le texte par défaut) n'apparaît que si rien d'autre n'explique l'erreur
const showError = computed(
	() => !valid.value && (!!slots.error || messages.value.length === 0),
);

const hasError = computed(
	() =>
		!valid.value ||
		missing.value ||
		props.invalid ||
		rejectedFile.value ||
		(hasLimits.value && counter.value.isOver),
);

/* -------------------------------------------------------------------------- */
/*  Apparence                                                                 */
/* -------------------------------------------------------------------------- */

const SIZE_CLASSES = {
	small: "px-3 py-2 text-sm rounded-lg",
	medium: "px-4 py-3 text-base rounded-xl",
	large: "px-6 py-3 text-lg rounded-full",
} as const;

const fieldClass = computed(() => [
	"flex w-full gap-1 bg-input font-medium text-input-text outline-2 transition",
	SIZE_CLASSES[props.size],
	isTextarea.value ? "min-h-24 flex-1 items-stretch" : "items-center",
	props.disabled ? "cursor-not-allowed opacity-50" : "cursor-text",
	hasError.value
		? "outline-danger"
		: focused.value
			? "outline-input-focus-ring"
			: "outline-transparent",
]);

/* -------------------------------------------------------------------------- */
/*  Événements                                                                */
/* -------------------------------------------------------------------------- */

const onInput = (event: Event) => {
	const target = event.target as HTMLInputElement;

	switch (props.type) {
		case "number":
			emit(
				"update:modelValue",
				target.value === "" ? null : Number(target.value),
			);
			break;
		case "checkbox":
			emit("update:modelValue", target.checked);
			break;
		default:
			emit("update:modelValue", target.value);
	}
};

const onFile = (file: File | null) => {
	rejectedFile.value = false;
	emit("update:modelValue", file);
};

const onFocus = (event: FocusEvent) => {
	emit("focus", event);
	valid.value = true;
	missing.value = false;
	focused.value = true;
};

const onBlur = (event: FocusEvent) => {
	emit("blur", event);
	focused.value = false;
	validateNow();
};

const onEnter = (event: KeyboardEvent) => {
	if (!isValid.value) {
		valid.value = false;
		missing.value = props.required && !hasValue.value;
		return;
	}

	emit(
		"enter",
		(event.target as HTMLInputElement | HTMLTextAreaElement).value,
	);
	validateNow();
};

// Dans une zone de texte, Entrée fait un retour à la ligne : on valide avec Ctrl / ⌘ + Entrée
const onTextareaKeydown = (event: KeyboardEvent) => {
	if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
		event.preventDefault();
		onEnter(event);
	}
};

const toggleSwitch = () => {
	if (props.disabled) return;

	const next = !props.modelValue;
	emit("update:modelValue", next);
	emit("enter", next.toString());
};
</script>

<template>
	<!-- Interrupteur -->
	<div
		v-if="type === 'checkbox'"
		role="switch"
		tabindex="0"
		:aria-checked="!!modelValue"
		:aria-disabled="disabled"
		class="flex cursor-pointer select-none items-center gap-2 outline-none"
		:class="{ 'cursor-not-allowed opacity-50': disabled }"
		@click="toggleSwitch"
		@keydown.space.prevent="toggleSwitch"
		@keydown.enter.prevent="toggleSwitch"
	>
		<span class="relative h-4 w-10 shrink-0 rounded-lg bg-surface">
			<span
				class="absolute -top-1 left-0 h-6 w-6 rounded-full bg-primary transition-transform duration-200"
				:class="modelValue ? 'translate-x-4' : 'translate-x-0'"
			/>
		</span>
		<span v-if="label" class="font-semibold text-muted">{{ label }}</span>
	</div>

	<!-- Zone de texte enrichie -->
	<RichTextarea
		v-else-if="isTextarea && rich"
		:model-value="textValue"
		:label="label"
		:placeholder="placeholder"
		:disabled="disabled"
		:invalid="invalid || !valid"
		:required="required"
		:min-length="minLength"
		:max-length="maxLength"
		:actions="actions"
		:tools="tools"
		@update:model-value="emit('update:modelValue', $event)"
		@focus="emit('focus', $event)"
		@blur="emit('blur', $event)"
		@enter="emit('enter', $event)"
	/>

	<!-- Champs standards : texte, zone de texte simple, fichier -->
	<FieldWrapper
		v-else
		:label="label"
		:required="required"
		:for-id="fieldId"
		:messages="messages"
		:show-error="showError"
	>
		<InputFile
			v-if="type === 'file'"
			:model-value="modelValue as File | null"
			:input-id="fieldId"
			:accept="accept"
			:disabled="disabled"
			:invalid="hasError"
			:placeholder="placeholder || undefined"
			@update:model-value="onFile"
			@reject="rejectedFile = true"
		/>

		<div v-else-if="isTextarea" :class="fieldClass">
			<textarea
				:id="fieldId"
				class="h-full min-w-0 w-full grow resize-none bg-transparent outline-none"
				:value="textValue"
				:placeholder="placeholder"
				:disabled="disabled"
				@input="onInput"
				@focus="onFocus"
				@blur="onBlur"
				@keydown="onTextareaKeydown"
			/>
		</div>

		<div v-else :class="fieldClass">
			<component
				:is="icon"
				v-if="icon"
				class="h-5 w-5 shrink-0 text-muted"
			/>
			<input
				:id="fieldId"
				:type="
					type === 'password'
						? isPwdVisible
							? 'text'
							: 'password'
						: type
				"
				class="min-w-0 grow bg-transparent outline-none"
				:value="modelValue as string | number"
				:placeholder="placeholder"
				:disabled="disabled"
				:accept="accept"
				:min="type === 'number' ? min : undefined"
				:max="type === 'number' ? max : undefined"
				@input="onInput"
				@focus="onFocus"
				@blur="onBlur"
				@keydown.enter="onEnter"
			/>
			<button
				v-if="type === 'password'"
				type="button"
				class="shrink-0 text-muted"
				:aria-label="
					isPwdVisible
						? 'Masquer le mot de passe'
						: 'Afficher le mot de passe'
				"
				@click="isPwdVisible = !isPwdVisible"
			>
				<EyeIcon v-if="isPwdVisible" class="h-5 w-5" />
				<EyeSlashIcon v-else class="h-5 w-5" />
			</button>
		</div>

		<template v-if="slots.error" #error>
			<slot name="error" />
		</template>
		<template v-if="slots.indications" #indications>
			<slot name="indications" />
		</template>
		<template v-if="hasLimits" #counter>
			<CharCounter
				:length="textValue.length"
				:min="minLength"
				:max="maxLength"
				:format="isTextarea ? 'ratio' : 'remaining'"
			/>
		</template>
	</FieldWrapper>
</template>
