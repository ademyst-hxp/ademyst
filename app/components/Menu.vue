<script setup lang="ts">
import Box from "./base/Box.vue";
import Popup from "./base/Popup.vue";

const props = defineProps<{
	title?: string;
	actions?: {
		label: string;
		icon?: Component;
		danger?: boolean;
		handler: string | (() => void | Promise<void>);
	}[];
}>();

const emit = defineEmits<{
	(e: "close"): void;
}>();

const close = () => {
	emit("close");
};

const router = useRouter();

const handleSelect = (handler: string | (() => void | Promise<void>)) => {
	if (typeof handler === "function") {
		handler();
	} else {
		router.push(handler);
	}
	close();
};
</script>
<template>
	<Popup>
		<slot />
		<Box class="items-center w-full max-h-full sm:w-lg">
			<h2 class="text-3xl font-medium text-surface-text mb-4">
				{{ title || "Menu" }}
			</h2>
			<div
				class="flex flex-col items-center gap-4 text-xl divide-y divide-surface-border overflow-y-auto"
			>
				<div
					v-for="action in actions"
					:key="action.label"
					:class="[
						'flex items-center gap-2 transition-colors duration-200 hover:underline cursor-pointer',
						action.danger ? 'text-danger' : ''
					]"
					@click="handleSelect(action.handler)"
				>
					<component :is="action.icon" v-if="action.icon" class="w-6 h-6" />
					{{ action.label }}
				</div>
				<div
					class="flex items-center gap-2 transition-colors duration-200 hover:underline cursor-pointer"
					@click="close()"
				>
					Fermer
				</div>
			</div>
		</Box>
	</Popup>
</template>
