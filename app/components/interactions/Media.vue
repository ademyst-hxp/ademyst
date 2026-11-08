<script setup lang="ts">
import {
	ArrowsPointingOutIcon,
	ExclamationTriangleIcon,
	PhotoIcon,
	VideoCameraIcon,
	XMarkIcon,
} from "@heroicons/vue/24/outline";

import { ratioToCss } from "~~/shared/utils/attachments";

import type { Attachment, MediaRatio } from "~~/shared/models/drive";

import Popup from "../base/Popup.vue";

const props = withDefaults(
	defineProps<{
		data: Attachment;
		// Mode prévisualisation (publication en cours d'écriture) : bouton de retrait + badge ALT
		preview?: boolean;
		// Envoi en cours : affiche le squelette de chargement
		loading?: boolean;
		// Impose un ratio (grille de plusieurs médias)
		forceRatio?: MediaRatio;
	}>(),
	{
		preview: false,
		loading: false,
	},
);

const emit = defineEmits<{
	(e: "remove"): void;
}>();

const isVideo = computed(() => props.data.type === "video");

const status = ref<"loading" | "loaded" | "error">("loading");
const reloadKey = ref(0);
const isFullscreen = ref(false);

const imageRef = ref<HTMLImageElement | null>(null);

const alt = computed(() => props.data.altText || "Média de la publication");

const showSkeleton = computed(
	() => props.loading || status.value === "loading",
);

const onLoad = () => {
	status.value = "loaded";
};

const onError = () => {
	status.value = "error";
};

const retry = () => {
	status.value = "loading";
	reloadKey.value++;
};

const openFullscreen = () => {
	if (props.loading || status.value !== "loaded") return;

	isFullscreen.value = true;
};

const closeFullscreen = () => {
	isFullscreen.value = false;
};

// L'image peut être déjà chargée avant l'hydratation : @load ne se déclenche alors pas.
onMounted(() => {
	if (imageRef.value?.complete && imageRef.value.naturalWidth > 0) {
		status.value = "loaded";
	}
});

// Échap ferme le plein écran
const onKeydown = (event: KeyboardEvent) => {
	if (event.key === "Escape") closeFullscreen();
};

watch(isFullscreen, (open) => {
	if (open) {
		window.addEventListener("keydown", onKeydown);
	} else {
		window.removeEventListener("keydown", onKeydown);
	}
});

onBeforeUnmount(() => {
	if (import.meta.client) {
		window.removeEventListener("keydown", onKeydown);
	}
});
</script>
<template>
	<div>
		<div
			class="relative overflow-hidden rounded-2xl border border-surface-border bg-muted-background"
			:style="{ aspectRatio: ratioToCss(forceRatio ?? data.ratio) }"
		>
			<template v-if="!loading">
				<Video
					v-if="isVideo"
					:key="`video-${reloadKey}`"
					:src="data.link"
					class="h-full w-full object-cover transition-opacity duration-200"
					:class="status === 'loaded' ? 'opacity-100' : 'opacity-0'"
					@load="onLoad"
					@error="onError"
				/>
				<img
					v-else
					ref="imageRef"
					:key="`image-${reloadKey}`"
					:src="data.link"
					:alt="alt"
					loading="lazy"
					class="h-full w-full object-cover transition-opacity duration-200"
					:class="[
						status === 'loaded'
							? 'opacity-100 cursor-zoom-in'
							: 'opacity-0',
					]"
					@load="onLoad"
					@error="onError"
					@click="openFullscreen"
				/>
			</template>

			<div
				v-if="showSkeleton && status !== 'error'"
				class="absolute inset-0 flex items-center justify-center animate-pulse text-surface-text-muted pointer-events-none"
			>
				<VideoCameraIcon v-if="isVideo" class="h-8 w-8" />
				<PhotoIcon v-else class="h-8 w-8" />
			</div>

			<div
				v-if="status === 'error' && !loading"
				class="absolute inset-0 flex flex-col items-center justify-center gap-1 p-4 text-center"
			>
				<ExclamationTriangleIcon class="h-8 w-8 text-warning" />
				<p class="text-sm text-surface-text-muted">
					Impossible de charger ce média.
				</p>
				<Button
					label="Réessayer"
					variant="link"
					size="small"
					:handler="retry"
				/>
			</div>

			<div
				v-if="!loading && (preview || status === 'loaded')"
				class="absolute top-2 right-2 flex items-center gap-1 rounded-xl bg-black/40 p-1 backdrop-blur-sm"
			>
				<Button
					v-if="status === 'loaded'"
					:icon="ArrowsPointingOutIcon"
					variant="white"
					size="small"
					:handler="openFullscreen"
				/>
				<Button
					v-if="preview"
					:icon="XMarkIcon"
					variant="white"
					size="small"
					:handler="() => emit('remove')"
				/>
			</div>

			<span
				v-if="preview && !loading && data.altText"
				class="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-xs font-semibold text-white"
			>
				ALT
			</span>
		</div>

		<Popup v-if="isFullscreen" @close="closeFullscreen">
			<Video
				v-if="isVideo"
				:src="data.link"
				class="max-h-full max-w-full rounded-2xl"
			/>
			<img
				v-else
				:src="data.link"
				:alt="alt"
				class="min-h-0 max-h-full max-w-full rounded-2xl object-contain"
			/>
			<p
				v-if="data.altText"
				class="max-w-lg text-center text-sm text-muted"
			>
				{{ data.altText }}
			</p>
			<Button
				label="Fermer"
				variant="white"
				:icon="XMarkIcon"
				:handler="closeFullscreen"
			/>
		</Popup>
	</div>
</template>
