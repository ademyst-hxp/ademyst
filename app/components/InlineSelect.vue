<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		label: string;
		options: {
			label?: string;
			value: string;
			icon?: Component;
			disabled?: boolean;
		}[];
		modelValue: string;
		scale?: "small" | "medium" | "large";
	}>(),
	{
		scale: "medium",
	},
);

const emit = defineEmits<{
	(e: "update:modelValue", value: string): void;
}>();

function updateModelValue(value: string) {
	emit("update:modelValue", value);
}

/*******************/

const getOptionClass = (option: (typeof props.options)[number]) => {
	let _class = "transition-all duration-200 ease-out flex items-center rounded-full";

	if (props.modelValue === option.value) {
		_class += " bg-primary/10 text-primary";
	} else {
		_class += " bg-primary/0 text-surface-text";
	}

	if (option.disabled) {
		_class += " opacity-50 cursor-not-allowed";
	} else {
		_class += " cursor-pointer";
	}

	switch (props.scale) {
		case "small":
			_class += " px-3 py-2 gap-0.5 text-sm font-medium";
			break;
		case "large":
			_class += " px-4 py-3 gap-1.5 text-lg font-semibold";
			break;
		case "medium":
		default:
			_class += " px-3 py-2 gap-1 text-base font-medium";
			break;
	}

	return _class;
};

const getOptionIconClass = () => {
	let _class = "";

	switch (props.scale) {
		case "small":
			_class += " w-5 h-5";
			break;
		case "large":
			_class += " w-7 h-7";
			break;
		case "medium":
		default:
			_class += " w-6 h-6";
			break;
	}

	return _class;
};

const optionsClasses = computed(() => ({
	...props.options.reduce(
		(acc, option) => {
			acc[option.value] = getOptionClass(option);
			return acc;
		},
		{} as Record<string, string>,
	),
}));

const iconsClasses = computed(() => ({
	...props.options.reduce(
		(acc, option) => {
			acc[option.value] = getOptionIconClass();
			return acc;
		},
		{} as Record<string, string>,
	),
}));
</script>
<template>
	<div class="flex flex-col gap-1 w-fit max-w-full overflow-x-auto">
		<!--label class="text-sm font-semibold text-muted">{{ label }}</label-->
		<div
			class="flex items-stretch bg-surface text-surface-text border border-surface-border rounded-full w-fit p-1"
		>
			<button
				v-for="option in options"
				:key="option.label"
				type="button"
				:class="optionsClasses[option.value]"
				:disabled="option.disabled"
				@click="
					() => {
						updateModelValue(option.value);
					}
				"
			>
				<component
					v-if="option.icon"
					:is="option.icon"
					:class="iconsClasses[option.value]"
				/>
				<span v-if="option.label">{{ option.label }}</span>
			</button>
		</div>
	</div>
</template>
