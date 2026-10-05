<script setup lang="ts">
import Box from "./base/Box.vue";
import Popup from "./base/Popup.vue";

const props = defineProps<{
	title?: string;
	description?: string;
	actions?: {
		label: string;
		icon?: Component;
		variant?:
			| "primary"
			| "secondary"
			| "white"
			| "success"
			| "warning"
			| "danger"
			| "link";
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
</script>
<template>
	<Popup>
		<slot />
		<Box class="items-center w-full max-h-full sm:w-lg">
			<h2 class="text-xl font-semibold text-surface-text font-title sm:text-3xl">
				{{ title || "Choisir" }}
			</h2>
			<p v-if="description" class="text-surface-text text-center w-full">
				{{ description }}
			</p>
			<div class="flex items-center justify-center gap-4 w-full">
				<Button
					v-for="action in actions"
					:key="action.label"
					:label="action.label"
					:variant="action.variant ?? 'link'"
					:icon="action.icon"
					:handler="
						() => {
							if (typeof action.handler === 'function') {
								action.handler();
							} else {
								router.push(action.handler);
							}
							close();
						}
					"
				/>
			</div>
		</Box>
	</Popup>
</template>
