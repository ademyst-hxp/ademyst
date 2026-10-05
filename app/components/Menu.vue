<script setup lang="ts">
import Box from "./base/Box.vue";
import Popup from "./base/Popup.vue";

const props = defineProps<{
	title?: string;
	actions?: {
		label: string;
		description?: string;
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
			<h2 class="text-xl font-semibold text-surface-text mb-4 font-title sm:text-3xl">
				{{ title || "Menu" }}
			</h2>
			<div
				class="flex flex-col items-start gap-4 text-xl overflow-y-auto w-full"
			>
				<a
					v-for="action in actions"
					:key="action.label"
					:class="[
						'group flex items-center gap-2 transition-colors duration-200 w-full cursor-pointer',
						action.danger ? 'text-danger' : '',
					]"
					@click="handleSelect(action.handler)"
					tabindex="0"
				>
					<component
						:is="action.icon"
						v-if="action.icon"
						class="w-8 h-8"
					/>
					<div class="flex flex-col -space-y-1">
						<span class="font-medium group-hover:underline">{{ action.label }}</span>
						<p
							v-if="action.description"
							class="text-sm text-surface-text-muted"
						>
							{{ action.description }}
						</p>
					</div>
				</a>
				<a
					class="flex items-center self-center gap-2 font-medium transition-colors duration-200 hover:underline cursor-pointer"
					@click="close()"
				>
					Fermer
				</a>
			</div>
		</Box>
	</Popup>
</template>
