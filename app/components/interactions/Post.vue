<script setup lang="ts">
import type { Post, PostFlag } from "~~/shared/models/interactions";

import Box from "../base/Box.vue";

import ProfileRow from "../profile/ProfileRow.vue";

import { convertToLitteralDuration } from "~/utils/date";

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
	ClipboardDocumentIcon,
	ScaleIcon,
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

const post = ref<Post>(props.data);

watch(
	() => props.data,
	(newPost) => {
		post.value = newPost;
	},
);

const { likePost, unlikePost } = usePostInteractions();

const copyToClipboard = async () => {
	try {
		await navigator.clipboard.writeText(props.data.content);
	} catch (err) {
		console.error("Failed to copy text: ", err);
	}
};

const copyLinkToClipboard = async () => {
	try {
		await navigator.clipboard.writeText(
			`${window.location.origin}/posts/${props.data.id}`,
		);
	} catch (err) {
		console.error("Failed to copy text: ", err);
	}
};

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
			handler: () => {
				isDeleteMenuOpen.value = true;
			},
		});

		actions.push({
			label: "Modifier la publication",
			icon: PencilIcon,
			handler: () => {
				navigateTo("/write?edit=" + props.data.id);
			},
		});
	} else {
		actions.push({
			label: "Signaler la publication",
			icon: FlagIcon,
			danger: true,
			handler: () => {
				navigateTo("/posts/" + props.data.id + "/report");
			},
		});
	}

	actions.push({
		label: "Copier le contenu",
		icon: ClipboardDocumentIcon,
		handler: copyToClipboard,
	});

	actions.push({
		label: "Copier le lien",
		icon: PaperAirplaneIcon,
		handler: copyLinkToClipboard,
	});

	if (session.value?.profile?.level ?? 0 > 6) {
		actions.push({
			label: "Modérer la publication",
			icon: ScaleIcon,
			handler: () => {
				navigateTo("/posts/" + props.data.id + "/moderate");
			},
		});
	}

	return actions;
});

const isMenuOpen = ref(false);
const isDeleteMenuOpen = ref(false);

const rendered = computed(() => {
	return $md.render(props.data.content);
});
</script>
<template>
	<Box :key="'post-' + post.id" class="shrink-0">
		<div class="flex items-center gap-2">
			<ProfileRow :data="post.profile" />
			<div class="grow" />
			<span
				class="text-surface-text-muted"
				:class="post.updatedAt ? 'italic' : ''"
			>
				{{
					convertToLitteralDuration(
						new Date(),
						new Date(post.updatedAt || post.createdAt),
					)
				}}
			</span>
			<EllipsisVerticalIcon
				@click="isMenuOpen = !isMenuOpen"
				class="h-5 w-5 cursor-pointer"
			/>
		</div>
		<textarea
			v-if="editable"
			v-model="post.content"
			class="bg-black/10 rounded-xl p-2 -mx-2"
		></textarea>
		<div
			v-else
			class="break-after-all wrap-break-word post-content -mx-2 overflow-x-visible overflow-y-auto"
			:class="post.parentId ? 'max-h-96' : 'max-h-144'"
			v-html="rendered || '<em>Vide.</em>'"
			@click.self="$router.push(`/posts/${post.id}`)"
		/>
		<div class="flex flex-col gap-2" v-if="post.flags.length > 0">
			<div
				v-if="post.flags.some((flag: PostFlag) => flag.flag === 'AI')"
				class="flex items-center gap-2 bg-warning/20 text-warning border border-warning/40 rounded-xl p-4 -mx-2"
			>
				<p class="text-sm font-semibold">
					Cette publication peut contenir du contenu généré par une
					intelligence artificielle.
				</p>
			</div>
			<div
				v-if="post.flags.some((flag: PostFlag) => flag.flag === 'NFE')"
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
			<div
				class="flex items-center gap-1"
				@click="
					() => {
						(post.interaction.liked ? unlikePost : likePost)(
							post.id,
							() => {
								post.interaction.liked =
									!post.interaction.liked;
								post.stats.reactions.like += post.interaction
									.liked
									? 1
									: -1;
							},
							() => {
								post.interaction.liked =
									!post.interaction.liked;
								post.stats.reactions.like += post.interaction
									.liked
									? 1
									: -1;
							},
						);
					}
				"
			>
				<HeartSolidIcon
					class="text-red-500 h-6 w-6 cursor-pointer"
					v-if="post.interaction.liked"
				/>
				<HeartIcon class="h-6 w-6 cursor-pointer" v-else />
				<span class="text-lg">{{
					toLitteral(post.stats.reactions.like || 0)
				}}</span>
			</div>
			<div
				class="flex items-center gap-1"
				@click="$router.push(`/posts/${post.id}#compose`)"
			>
				<ChatBubbleOvalLeftEllipsisIcon
					class="h-6 w-6 cursor-pointer"
				/>
				<span class="text-lg">{{ toLitteral(post.stats.answers || 0) }}</span>
			</div>
			<div class="grow" />
			<div class="flex items-center gap-1" @click="copyLinkToClipboard">
				<PaperAirplaneIcon class="h-6 w-6 cursor-pointer" />
			</div>
			<!--div class="flex items-center gap-1">
				<BookmarkIcon class="h-6 w-6 cursor-pointer" />
			</div-->
		</div>
	</Box>

	<Menu v-if="isMenuOpen" @close="isMenuOpen = false" :actions="actions" />
	<Dialog
		title="Supprimer la publication ?"
		description="Cette action est irréversible."
		v-if="isDeleteMenuOpen"
		@close="isDeleteMenuOpen = false"
		:actions="[
			{
				label: 'Annuler',
				handler: async () => {},
			},
			{
				label: 'Confirmer',
				icon: TrashIcon,
				variant: 'danger',
				handler: async () => {
					try {
						await $api('/posts/' + data.id, { method: 'DELETE' });
						navigateTo('/discover');
					} catch (e: any) {
						console.error(
							'Erreur lors de la suppression du post:',
							e,
						);
					}
				},
			},
		]"
	/>
</template>
