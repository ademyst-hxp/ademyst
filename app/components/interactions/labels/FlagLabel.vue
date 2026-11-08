<script lang="ts" setup>
const props = defineProps<{
	label: string;
	icon: Component;
	variant?: "success" | "warning" | "danger";
}>();
</script>
<template>
	<span
		class="inline-flex items-center gap-0.5 text-surface-text-muted text-sm font-medium"
	>
		<component
			:is="props.icon"
			class="w-4 h-4"
			:class="{
				'text-success': props.variant === 'success',
				'text-warning': props.variant === 'warning',
				'text-danger': props.variant === 'danger',
			}"
		/>
		<span
			:class="{
				'text-danger': props.variant === 'danger',
			}"
		>
			{{ props.label }}
		</span>
	</span>
</template>
