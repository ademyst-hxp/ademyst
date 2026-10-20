<script setup lang="ts">
defineProps<{
	label: string;
	options: { label: string; value: string }[];
	id?: string;
}>();

const model = defineModel<string>({ default: "" });
</script>
<template>
	<div class="flex items-center gap-2 px-8">
		<label :for="id" class="text-sm font-semibold text-muted">
			{{ label }}
		</label>
		<select
			:id="id"
			v-model="model"
			class="bg-surface text-surface-text border border-surface-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
		>
			<option
				v-for="option in options"
				:key="option.value"
				:value="option.value"
			>
				{{ option.label }}
			</option>
		</select>
	</div>
</template>
