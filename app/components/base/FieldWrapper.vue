<script setup lang="ts">
defineProps<{
	label?: string;
	required?: boolean;
	forId?: string;
	/** Messages d'erreur générés par le champ */
	messages?: string[];
	/** Affiche le slot #error (ou "Entrée invalide." par défaut) */
	showError?: boolean;
}>();
</script>
<template>
	<div class="flex flex-col gap-1 text-sm">
		<label v-if="label" :for="forId" class="px-4 text-sm text-muted">
			{{ label }} <span v-if="required" class="text-danger">*</span>
		</label>

		<slot />

		<div
			v-if="
				messages?.length ||
				showError ||
				$slots.indications ||
				$slots.counter
			"
			class="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 px-4 text-sm"
		>
			<div class="flex min-w-0 flex-col gap-1">
				<p v-for="message in messages" :key="message" class="text-danger">
					{{ message }}
				</p>
				<div v-if="showError" class="text-danger">
					<slot name="error">Entrée invalide.</slot>
				</div>
				<div v-if="$slots.indications" class="flex flex-col gap-1">
					<slot name="indications" />
				</div>
			</div>

			<div v-if="$slots.counter" class="ml-auto shrink-0">
				<slot name="counter" />
			</div>
		</div>
	</div>
</template>
