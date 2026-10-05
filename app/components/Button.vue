<script setup lang="ts">
import { EllipsisHorizontalIcon } from "@heroicons/vue/24/outline";

const props = withDefaults(defineProps<{
	label?: string;
	icon?: Component;
	handler?: string | (() => void) | (() => Promise<void>);
	variant?:
		| "primary"
		| "secondary"
		| "white"
		| "danger"
		| "success"
		| "warning"
		| "link";
	size?: "small" | "medium" | "large";
	disabled?: boolean;
	submit?: boolean;
}>(), {
	variant: "primary",
	size: "medium",
	disabled: false,
	submit: false,
	handler: () => {},
});

let _class = "flex items-center text-medium font-medium transition-colors duration-200";
let _iconclass = "";

switch (props.size) {
	case "small":
		_class +=
			props.variant === "link"
				? "text-sm"
				: " gap-1 text-sm rounded-tl-xl rounded-tr-md rounded-br-xl rounded-bl-md";

		if (props.variant != "link") {
			if (props.icon && props.label) {
				_class += " w-fit pl-2 pr-3 py-2";
			} else if (props.icon && !props.label) {
				_class += " justify-center w-8 h-8";
			} else if (!props.icon && props.label) {
				_class += " w-fit px-3 py-2";
			}
		}

		_iconclass += " w-5 h-5";
		break;
	case "large":
		_class +=
			props.variant === "link"
				? "text-lg"
				: " gap-2 text-lg rounded-tr-3xl rounded-tl-xl rounded-bl-3xl rounded-br-xl";

		if (props.variant != "link") {
			if (props.icon && props.label) {
				_class += " w-fit pl-4 pr-6 py-4";
			} else if (props.icon && !props.label) {
				_class += " justify-center w-12 h-12";
			} else if (!props.icon && props.label) {
				_class += " w-fit px-6 py-4";
			}
		}

		_iconclass += " w-8 h-8";
		break;
	case "medium":
	default:
		_class += props.variant === "link" ? "" : " gap-1.5 rounded-tr-2xl rounded-tl-lg rounded-bl-2xl rounded-br-lg";

		if (props.variant != "link") {
			if (props.icon && props.label) {
				_class += " w-fit pl-4 pr-5 py-3";
			} else if (props.icon && !props.label) {
				_class += " justify-center w-10 h-10";
			} else if (!props.icon && props.label) {
				_class += " w-fit px-5 py-3";
			}
		}

		_iconclass += " w-5 h-5";
}

switch (props.variant) {
	case undefined:
	case "primary":
		_class += " bg-gradient-to-tr from-primary to-secondary text-white hover:from-secondary hover:to-primary";
		break;
	case "secondary":
		_class += " bg-muted-background text-muted";
		break;
	case "white":
		_class += " bg-white/10 text-white border-2 border-white/20 hover:bg-white/15";
		break;
	case "danger":
		_class += " bg-danger text-white hover:bg-danger-darkened";
		break;
	case "success":
		_class += " bg-success text-white hover:bg-success-darkened";
		break;
	case "warning":
		_class += " bg-warning text-white hover:bg-warning-darkened";
		break;
	case "link":
		_class +=
			" text-primary underline decoration-transparent underline-offset-2 hover:decoration-primary bg-transparent";

		break;
	default:
		_class += " bg-button text-button-text hover:bg-button-hover";
}

const _stateclass = computed(() => {
	if (props.disabled) {
		return "opacity-50 cursor-not-allowed";
	}

	if (isLoading.value) {
		return "cursor-loading";
	}

	return "cursor-pointer";
});

// Handle click

const isLoading = ref<boolean>(false);
const hasError = ref<boolean>(false);

async function callback() {
	try {
		isLoading.value = true;
		hasError.value = false;

		if (typeof props.handler === "string") {
			if (props.handler.startsWith("@:")) {
				const url = props.handler.slice(2);
				window.open(url, "_blank");
			} else {
				window.location.href = props.handler;
			}
		} else {
			await props.handler();
		}
	} catch (error) {
		hasError.value = true;
	} finally {
		isLoading.value = false;
	}
}
</script>
<template>
	<button
		:class="[_class, _stateclass]"
		@click="callback"
		:disabled="props.disabled"
		:type="props.submit ? 'submit' : 'button'"
		tabindex="0"
	>
		<template v-if="isLoading">
			<EllipsisHorizontalIcon :class="_iconclass + ' animate-pulse'" />
		</template>
		<template v-else-if="hasError">
			<span class="text-danger">Erreur</span>
		</template>
		<template v-else>
			<component v-if="props.icon" :is="props.icon" :class="_iconclass" />
			<span v-if="props.label">{{ props.label }}</span>
		</template>
	</button>
</template>
