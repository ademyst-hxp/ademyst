<script setup lang="ts">
import type { Post, PostFlag } from "~~/shared/models/interactions";

import Box from "../base/Box.vue";

import ProfileRow from "../profile/ProfileRow.vue";

import {
	EllipsisVerticalIcon,
	HeartIcon as HeartSolidIcon,
} from "@heroicons/vue/24/solid";
import {
	FlagIcon,
	TrashIcon,
	PencilIcon,
	HeartIcon,
	ChatBubbleOvalLeftEllipsisIcon,
	PaperAirplaneIcon,
	BookmarkIcon,
} from "@heroicons/vue/24/outline";
import PostCard from "../cards/PostCard.vue";

const props = withDefaults(
	defineProps<{
		data: Post;
		editable?: boolean;
	}>(),
	{
		editable: false,
	},
);

const { $md } = useNuxtApp();
const { session } = useAuthSession();

const actions = computed(() => {
	const actions: {
		label: string;
		description?: string;
		icon: any;
		danger?: boolean;
		handler: () => void;
	}[] = [];

	if (props.data.profile?.id == session.value?.profile?.id) {
		actions.push({
			label: "Supprimer la publication",
			description: "Cette action est irréversible.",
			icon: TrashIcon,
			danger: true,
			handler: () => {},
		});

		actions.push({
			label: "Modifier la publication",
			icon: PencilIcon,
			handler: () => {},
		});
	} else {
		actions.push({
			label: "Signaler la publication",
			icon: FlagIcon,
			danger: true,
			handler: () => {},
		});
	}

	return actions;
});

const isMenuOpen = ref(false);

const rendered = computed(() => {
	return $md.render(props.data.content);
});
</script>
<template>
	<Box :key="'post-' + data.id" class="shrink-0">
		<div class="flex items-center">
			<ProfileRow :data="data.profile" />
			<div class="grow" />
			<EllipsisVerticalIcon
				@click="isMenuOpen = !isMenuOpen"
				class="h-5 w-5 cursor-pointer"
			/>
		</div>
		<PostCard :data="data" class="-mx-2" />
		<textarea
			v-if="editable"
			v-model="data.content"
			class="bg-black/10 rounded-xl p-2 -mx-2"
		></textarea>
		<div
			v-else
			class="break-after-all wrap-break-word post-content -mx-2 overflow-x-visible overflow-y-auto"
			:class="data.parentId ? 'max-h-96' : 'max-h-144'"
			v-html="rendered || '<em>Vide.</em>'"
		/>
		<div class="flex flex-col gap-2" v-if="data.flags.length > 0">
			<div
				v-if="data.flags.some((flag: PostFlag) => flag.flag === 'AI')"
				class="flex items-center gap-2 bg-warning/20 text-warning border border-warning/40 rounded-xl p-4 -mx-2"
			>
				<p class="text-sm font-semibold">
					Cette publication peut contenir du contenu généré par une
					intelligence artificielle.
				</p>
			</div>
			<div
				v-if="data.flags.some((flag: PostFlag) => flag.flag === 'NFE')"
				class="flex items-center gap-2 bg-warning/20 text-warning border border-warning/40 rounded-xl p-4 -mx-2"
			>
				<p class="text-sm font-semibold">
					Cette publication peut contenir des propos ou du contenu
					choquant pour un jeune public.
				</p>
			</div>
		</div>

		<div
			class="flex items-center gap-4"
			:class="editable ? 'opacity-50' : ''"
		>
			<div class="flex items-center gap-1">
				<HeartIcon class="h-6 w-6 cursor-pointer" />
				<span class="text-lg">{{
					data.stats.reactions.like || 0
				}}</span>
			</div>
			<div class="flex items-center gap-1">
				<ChatBubbleOvalLeftEllipsisIcon
					class="h-6 w-6 cursor-pointer"
				/>
				<span class="text-lg">{{ data.stats.answers || 0 }}</span>
			</div>
			<div class="grow" />
			<div class="flex items-center gap-1">
				<PaperAirplaneIcon class="h-6 w-6 cursor-pointer" />
			</div>
			<div class="flex items-center gap-1">
				<BookmarkIcon class="h-6 w-6 cursor-pointer" />
			</div>
		</div>
	</Box>
	<Menu v-if="isMenuOpen" @close="isMenuOpen = false" :actions="actions" />
</template>
