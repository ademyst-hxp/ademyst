<script setup lang="ts">
const slots = useSlots();

const props = withDefaults(
	defineProps<{
		scale?: "sm" | "md";
	}>(),
	{
		scale: "sm",
	},
);
</script>
<style>
@reference "@/assets/css/main.css";

.mystui-table {
	border-collapse: separate;
	border-spacing: 0;
}

.mystui-table td,
.mystui-table th {
	@apply px-4 py-3;
}

.mystui-table th {
	@apply bg-surface/20 text-surface-text-muted text-left font-semibold font-title border-b border-surface-border;
}

.mystui-table td {
	@apply text-surface-text border-b border-surface-border;
}

.mystui-table thead th {
	@apply text-surface-text text-lg;
}

.mystui-table tbody tr:nth-child(odd) td,
.mystui-table tbody tr:nth-child(odd) th {
	@apply bg-surface/60;
}

.mystui-table tbody tr:nth-child(even) td,
.mystui-table tbody tr:nth-child(even) th {
	@apply bg-surface/20;
}

.mystui-table tbody tr:last-child td,
.mystui-table tbody tr:last-child th {
	@apply border-b-0;
}
</style>
<template>
	<div class="overflow-x-auto rounded-2xl border border-surface-border">
		<table class="mystui-table min-w-full bg-surface/20">
			<thead v-if="slots.head">
				<slot name="head" />
			</thead>
			<tbody v-if="slots.body">
				<slot name="body" />
			</tbody>
		</table>
	</div>
</template>
