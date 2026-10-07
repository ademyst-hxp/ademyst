<script setup lang="ts">
import { EyeIcon, EyeSlashIcon } from "@heroicons/vue/24/solid";

const props = withDefaults(
	defineProps<{
		label?: string;
		icon?: Component;
		modelValue?: string | number | boolean | Date | File | null;
		type?: string;
		size?: "small" | "medium" | "large";
		placeholder?: string;
		validate?: RegExp;
		disabled?: boolean;
		invalid?: boolean;
		required?: boolean;
		min?: number;
		max?: number;
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
	},
);

const emit = defineEmits<{
	(
		e: "update:modelValue",
		value: string | number | boolean | Date | File | null,
	): void;
	(e: "focus", event: FocusEvent): void;
	(e: "blur", event: FocusEvent): void;
	(e: "enter", value: string): void;
}>();

const focused = ref<boolean>(false);
const valid = ref<boolean>(true);
const missing = ref<boolean>(false);
const outOfRange = ref<boolean>(false);

const rootClass = computed(() => {
	let value =
		"bg-input text-input-text w-full text-medium font-medium outline-2 transition";

	switch (props.size) {
		case "small":
			value += " px-3 py-2 text-sm rounded-lg";
			break;
		case "large":
			value += " px-6 py-3 text-lg rounded-full";
			break;
		case "medium":
		default:
			value += " px-4 py-3 rounded-xl";
	}

	if (props.disabled) {
		value += " opacity-50 cursor-not-allowed";
	} else {
		value += " cursor-text";
	}

	if (!valid.value || missing.value || outOfRange.value) {
		value += " outline-danger";
	} else if (focused.value) {
		value += " outline-input-focus-ring";
	} else {
		value += " outline-transparent";
	}

	return value;
});

const isPwdVisible = ref(false);

const isValid = computed(() => {
	if (props.required && !props.modelValue) return false;

	if (props.validate) {
		return props.validate.test(props.modelValue as string);
	}

	if (props.type === "number") {
		const value = Number(props.modelValue);

		outOfRange.value =
			(props.min !== undefined && value < props.min) ||
			(props.max !== undefined && value > props.max);
		if (isNaN(value)) return false;
		if (props.min !== undefined && value < props.min) return false;
		if (props.max !== undefined && value > props.max) return false;
	}

	return !props.invalid;
});

const isFilled = computed(() => {
	return !!props.modelValue;
});

function onInput(event: Event) {
	const target = event.target as HTMLInputElement;

	switch (props.type) {
		case "number":
			emit("update:modelValue", Number(target.value));
			break;

		case "checkbox":
			emit("update:modelValue", target.checked);
			break;

		case "file":
			emit("update:modelValue", target.files?.[0] ?? null);
			break;

		default:
			emit("update:modelValue", target.value);
			break;
	}
}

function onFocus(event: FocusEvent) {
	emit("focus", event);
	valid.value = true;
	focused.value = true;
	missing.value = false;
}

function onBlur(event: FocusEvent) {
	emit("blur", event);
	focused.value = false;

	if (props.modelValue) {
		valid.value = isValid.value;
	} else {
		valid.value = true;
	}
}

function onEnter(event: KeyboardEvent) {
	const target = event.target as HTMLInputElement;

	if (!isValid.value) {
		valid.value = false;
		return;
	}

	emit("enter", target.value);

	focused.value = false;

	if (props.modelValue) {
		valid.value = isValid.value;
	} else {
		valid.value = true;
	}

	missing.value = props.required && !isFilled.value;
}
</script>
<template>
	<div
		v-if="type == 'checkbox'"
		class="flex items-center cursor-pointer gap-2"
		tabindex="0"
		@click="
			() => {
				if (!disabled) {
					$emit('update:modelValue', !(modelValue as boolean));
					$emit('enter', (!modelValue as boolean).toString());
				}
			}
		"
	>
		<div
			class="flex items-center cursor-pointer bg-surface rounded-lg w-10 h-4"
		>
			<div
				:class="(modelValue as boolean) ? 'w-full' : 'w-0'"
				class="transform-all duration-200"
			></div>
			<div class="bg-primary shrink-0 rounded-full p-3"></div>
		</div>
		<span class="font-semibold text-muted">{{ label }}</span>
	</div>
	<div v-else-if="type == 'textarea'" class="flex flex-col gap-1 text-sm">
		<span v-if="label" class="text-sm text-muted px-4">
			{{ label }} <span v-if="required" class="text-danger">*</span>
		</span>
		<div class="flex items-center gap-1 text-base" :class="rootClass">
			<textarea
				class="grow outline-none h-36 resize-none"
				:value="modelValue as string"
				:placeholder="placeholder"
				:disabled="disabled"
				@input="onInput"
				@focus="onFocus"
				@blur="onBlur"
				@keydown.enter="onEnter"
			/>
		</div>
		<div
			v-if="missing"
			class="flex flex-col gap-1 text-sm text-danger px-4"
		>
			Ce champ est obligatoire.
		</div>
		<div
			v-if="$slots.error && !valid"
			class="flex flex-col gap-1 text-sm text-danger px-4"
		>
			<slot name="error">Entrée invalide.</slot>
		</div>
		<div v-if="$slots.indications" class="flex flex-col gap-1 text-sm px-4">
			<slot name="indications" />
		</div>
	</div>
	<div v-else class="flex flex-col gap-1 text-sm">
		<span v-if="label" class="text-sm text-muted px-4">
			{{ label }} <span v-if="required" class="text-danger">*</span>
		</span>
		<div class="flex items-center gap-1 text-base" :class="rootClass">
			<component
				:is="props.icon"
				v-if="props.icon"
				class="w-5 h-5 text-muted"
			/>
			<input
				:type="
					type === 'password'
						? isPwdVisible
							? 'text'
							: 'password'
						: type
				"
				class="grow outline-none"
				:value="type === 'file' ? undefined : modelValue"
				:placeholder="placeholder"
				:disabled="disabled"
				@input="onInput"
				@focus="onFocus"
				@blur="onBlur"
				@keydown.enter="onEnter"
			/>
			<EyeIcon
				v-if="type === 'password' && isPwdVisible"
				class="cursor-pointer w-5 h-5 text-muted"
				@click="isPwdVisible = !isPwdVisible"
			/>
			<EyeSlashIcon
				v-else-if="type === 'password'"
				class="cursor-pointer w-5 h-5 text-muted"
				@click="isPwdVisible = !isPwdVisible"
			/>
		</div>
		<div
			v-if="missing"
			class="flex flex-col gap-1 text-sm text-danger px-4"
		>
			Ce champ est obligatoire.
		</div>
		<div
			v-if="outOfRange"
			class="flex flex-col gap-1 text-sm text-danger px-4"
		>
			Ce champ doit être
			{{
				min && max
					? `compris entre ${min} et ${max}`
					: min
						? `supérieur à ${min}`
						: max
							? `inférieur à ${max}`
							: ""
			}}
		</div>
		<div
			v-if="$slots.error && !valid"
			class="flex flex-col gap-1 text-sm text-danger px-4"
		>
			<slot name="error">Entrée invalide.</slot>
		</div>
		<div v-if="$slots.indications" class="flex flex-col gap-1 text-sm px-4">
			<slot name="indications" />
		</div>
	</div>
</template>
