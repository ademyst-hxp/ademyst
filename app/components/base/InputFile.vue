<script setup lang="ts">
import {
	ArrowUpTrayIcon,
	DocumentIcon,
	XMarkIcon,
} from "@heroicons/vue/24/outline";

import { describeAccept, matchesAccept } from "~/utils/fileAccept";

const props = withDefaults(
	defineProps<{
		modelValue?: File | null;
		accept?: string;
		disabled?: boolean;
		invalid?: boolean;
		placeholder?: string;
		inputId?: string;
	}>(),
	{
		modelValue: null,
		disabled: false,
		invalid: false,
		placeholder: "Choisir un fichier",
	},
);

const emit = defineEmits<{
	(e: "update:modelValue", value: File | null): void;
	/** Fichier refusé (glisser-déposer ou sélection hors `accept`) */
	(e: "reject", file: File): void;
}>();

const inputEl = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
const previewUrl = ref<string | null>(null);

const hint = computed(() => describeAccept(props.accept));

// Miniature des images (l'URL est libérée à chaque changement et au démontage)
const revokePreview = () => {
	if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
	previewUrl.value = null;
};

watch(
	() => props.modelValue,
	(file) => {
		if (!import.meta.client) return;
		revokePreview();
		if (file && file.type.startsWith("image/")) {
			previewUrl.value = URL.createObjectURL(file);
		}
	},
	{ immediate: true },
);

onBeforeUnmount(revokePreview);

const open = () => {
	if (!props.disabled) inputEl.value?.click();
};

const select = (file: File | null | undefined) => {
	if (!file || props.disabled) return;

	if (!matchesAccept(file, props.accept)) {
		emit("reject", file);
		return;
	}

	emit("update:modelValue", file);
};

const onChange = (event: Event) => {
	const input = event.target as HTMLInputElement;
	select(input.files?.[0]);
	// Permet de re-sélectionner le même fichier après l'avoir retiré
	input.value = "";
};

const onDrop = (event: DragEvent) => {
	dragging.value = false;
	select(event.dataTransfer?.files?.[0]);
};

const clear = () => emit("update:modelValue", null);
</script>

<template>
	<div
		class="w-full"
		@dragover.prevent="!disabled && (dragging = true)"
		@dragleave.prevent="dragging = false"
		@drop.prevent="onDrop"
	>
		<!-- Le vrai champ reste dans le DOM (formulaires, <label for>) mais invisible -->
		<input
			:id="inputId"
			ref="inputEl"
			type="file"
			class="sr-only"
			tabindex="-1"
			:accept="accept"
			:disabled="disabled"
			@change="onChange"
		/>

		<!-- Aucun fichier : zone de dépôt -->
		<button
			v-if="!modelValue"
			type="button"
			class="flex w-full items-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 text-left outline-none transition-colors focus-visible:border-input-focus-ring"
			:class="[
				invalid
					? 'border-danger'
					: dragging
						? 'border-input-focus-ring bg-surface-hover'
						: 'border-surface-border hover:bg-surface-hover',
				disabled && 'cursor-not-allowed opacity-50',
			]"
			:disabled="disabled"
			@click="open"
		>
			<span
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface"
			>
				<ArrowUpTrayIcon class="h-5 w-5 text-muted" />
			</span>
			<span class="flex min-w-0 flex-col">
				<span class="truncate font-medium">{{ placeholder }}</span>
				<span class="truncate text-sm text-muted">
					<span class="max-sm:hidden">Glissez-déposez ou cliquez · </span>
					{{ hint }}
				</span>
			</span>
		</button>

		<!-- Fichier choisi : récapitulatif -->
		<div
			v-else
			class="flex items-center gap-3 rounded-xl bg-input px-3 py-2 outline-2 transition-colors"
			:class="[
				invalid
					? 'outline-danger'
					: dragging
						? 'outline-input-focus-ring'
						: 'outline-transparent',
				disabled && 'cursor-not-allowed opacity-50',
			]"
		>
			<img
				v-if="previewUrl"
				:src="previewUrl"
				alt=""
				class="h-12 w-12 shrink-0 rounded-lg object-cover"
			/>
			<span
				v-else
				class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface"
			>
				<DocumentIcon class="h-6 w-6 text-muted" />
			</span>

			<div class="flex min-w-0 grow flex-col">
				<span class="truncate font-medium" :title="modelValue.name">
					{{ modelValue.name }}
				</span>
				<span class="text-sm text-muted">
					{{ formatBytes(modelValue.size) }}
				</span>
			</div>

			<button
				type="button"
				class="shrink-0 text-sm font-medium text-muted hover:underline disabled:cursor-not-allowed max-sm:hidden"
				:disabled="disabled"
				@click="open"
			>
				Changer
			</button>
			<button
				type="button"
				aria-label="Retirer le fichier"
				class="shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-surface-hover disabled:cursor-not-allowed"
				:disabled="disabled"
				@click="clear"
			>
				<XMarkIcon class="h-5 w-5" />
			</button>
		</div>
	</div>
</template>
