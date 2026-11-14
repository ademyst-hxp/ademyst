<script setup lang="ts">
import { LockClosedIcon } from "@heroicons/vue/24/outline";
import type { Component } from "vue";

import Input from "~/components/Input.vue";

defineProps<{
	label: string;
	description: string;
	icon?: Component;
	// Précision affichée sous la description (ex. types jamais envoyés par mail)
	note?: string;
	modelValue: boolean;
	// Réglage imposé : l'interrupteur est verrouillé en position activée
	locked?: boolean;
}>();

const emit = defineEmits<{
	(e: "update:modelValue", value: boolean): void;
}>();
</script>
<template>
	<div class="flex items-start gap-3 p-4 sm:gap-4 sm:p-6">
		<component
			:is="icon"
			v-if="icon"
			class="mt-0.5 h-8 w-8 shrink-0 text-surface-text-muted"
		/>
		<div class="flex min-w-0 grow flex-col gap-1">
			<p class="text-lg font-medium leading-snug">{{ label }}</p>
			<p class="text-sm text-surface-text-muted">{{ description }}</p>
			<p v-if="note" class="text-sm text-surface-text-muted italic">
				{{ note }}
			</p>
			<p
				v-if="locked"
				class="mt-1 flex items-center gap-1 text-sm font-medium text-surface-text-muted"
			>
				<LockClosedIcon class="h-4 w-4" />
				Toujours actif
			</p>
		</div>
		<Input
			type="checkbox"
			:model-value="locked ? true : modelValue"
			:disabled="locked"
			:aria-label="`E-mails : ${label}`"
			class="mt-1.5 shrink-0"
			@update:model-value="emit('update:modelValue', !!$event)"
		/>
	</div>
</template>
