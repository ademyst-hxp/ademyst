<script setup lang="ts">
defineProps<{
	modelValue: string;
	tabs: {
		name: string;
		value: string;
		icon?: Component;
	}[];
}>();

const emit = defineEmits<{
	(e: "update:modelValue", value: string): void;
}>();
</script>
<template>
	<nav
		class="w-full overflow-x-auto max-md:px-8 md:w-fit md:mx-auto"
	>
		<ul class="flex justify-start gap-4 min-w-full w-max">
			<li
				class="cursor-pointer flex flex-col items-center gap-1 group"
				v-for="tab in tabs"
				:key="`tab-${tab.value}`"
				@click="$emit('update:modelValue', tab.value)"
			>
				<div
					class="text-lg text-center font-medium"
					:class="
						modelValue == tab.value ? 'text-primary' : 'text-muted'
					"
				>
					<component :is="tab.icon" v-if="tab.icon" class="w-5 h-5" />
					<span>{{ tab.name }}</span>
				</div>
				<div
					class="h-1 rounded-full transition-all duration-300"
					:class="modelValue == tab.value ? 'bg-primary w-3/3' : 'bg-muted w-0 group-hover:w-1/4'"
				></div>
			</li>
		</ul>
	</nav>
</template>
