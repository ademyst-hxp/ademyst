<script setup lang="ts">
import WhisperBox from "~/components/interactions/Whisper.vue";
import ProfileBox from "~/components/profile/ProfileBox.vue";
import PostBox from "~/components/interactions/Post.vue";

import {
	ArrowLeftIcon,
	ArrowRightIcon,
	PlusCircleIcon,
	UserIcon,
	PaperAirplaneIcon,
	NoSymbolIcon,
	ChatBubbleBottomCenterTextIcon,
	ArrowPathIcon,
} from "@heroicons/vue/24/solid";

import {
	GlobeAltIcon,
	RocketLaunchIcon,
	UserGroupIcon,
	HeartIcon,
	EyeSlashIcon,
} from "@heroicons/vue/24/outline";

import type { Whisper } from "~~/shared/models/interactions";
import Popup from "~/components/base/Popup.vue";

const { $api } = useNuxtApp();

const { session, refresh: refreshSession } = useAuthSession();
const { whispers, suggestions, hits, following, users, refresh } = useFeed();
const { blockUser } = useRelations();

await refresh();
await refreshSession();

definePageMeta({
	title: "Beam: Discover",
	description: "Découvrez des publications avec Beam Discover !",
	middleware: ["auth"],
});

useHead({
	title: "Beam: Discover",
	meta: [
		{
			name: "description",
			content: "Découvrez des publications avec Beam Discover !",
		},
		{
			name: "keywords",
			content: "Beam, Revolved, Discover",
		},
		{
			name: "author",
			content: "Ejnalo",
		},
		{
			name: "viewport",
			content: "width=device-width, initial-scale=1.0",
		},
	],
});

const tab = ref<"suggest" | "following" | "hits">("suggest");
const focusedWhisper = ref<Whisper | null>(null);

const isVisibilityMenuOpen = ref(false);
const visibilityOptions = ref({
	outside: {
		label: "Essai",
		description: "Tout le monde sauf vos abonnés",
		icon: RocketLaunchIcon,
	},
	everyone: {
		label: "Tout le monde",
		icon: GlobeAltIcon,
	},
	followers: {
		label: "Abonnés",
		icon: UserGroupIcon,
	},
	friends: {
		label: "Amis",
		icon: HeartIcon,
	},
	me: {
		label: "Privé",
		icon: EyeSlashIcon,
	},
});

const whisperColors = ref<{ background: string; text: string }[]>([
	{ background: "#fbd1d1", text: "#eb3030" },
	{ background: "#ffeacf", text: "#ffa732" },
	{ background: "#def8ea", text: "#2ed07c" },
	{ background: "#dbf7f8", text: "#29ced2" },
	{ background: "#d8e0ff", text: "#2757ff" },
	{ background: "#f2d8ff", text: "#b627ff" },
	{ background: "#ffd8fb", text: "#ff27e8" },
]);

const revertColors = ref<boolean>(false);

const editingWhisper = ref<boolean>(false);

const newWhisper = ref<Whisper>({
	id: "",
	content: "",
	color: null,
	textColor: null,
	image: null,
	profile: session.value!.profile,
	visibility: "everyone",
	createdAt: new Date(),
});

const handleNewWhisper = async () => {
	if (!newWhisper.value.content.trim()) return;
	if (newWhisper.value.content.length > 200) return;

	await $api("/whispers/new", {
		method: "POST",
		body: {
			content: newWhisper.value.content,
			color: newWhisper.value.color,
			textColor: newWhisper.value.textColor,
			image: newWhisper.value.image,
			visibility: newWhisper.value.visibility,
		},
	});

	newWhisper.value.content = "";
	newWhisper.value.color = null;
	newWhisper.value.textColor = null;
	newWhisper.value.image = null;
	newWhisper.value.visibility = "everyone";

	await refresh();
};

watch(
	() => editingWhisper,
	(newVal) => {
		if (newVal.value === true) {
			focusedWhisper.value = null;
		}
	},
);

watch(
	() => focusedWhisper,
	(newVal) => {
		console.log("Focused whisper changed:", newVal.value?.id);

		if (newVal.value) {
			editingWhisper.value = false;
		}
	},
);
</script>
<template>
	<div class="md:flex">
		<aside class="basis-1/4 max-xl:hidden">
			<!-- Vide -->
		</aside>
		<section
			class="basis-2/3 flex flex-col gap-4 overflow-y-auto p-4 max-md:order-0 md:p-8"
		>
			<header class="flex flex-col gap-4">
				<h2 class="text-2xl font-bold px-8">Pensées récentes</h2>
				<div
					class="flex justify-start items-stretch gap-2 rounded-3xl overflow-x-auto scrollbar-none w-full h-24 sm:gap-4"
				>
					<div
						class="shrink-0 flex items-center justify-center bg-surface text-surface-text-muted border border-dashed border-surface-border rounded-3xl w-36 p-4 md:w-48 md:p-8 cursor-pointer transition-all duration-150 hover:scale-98"
						@click="editingWhisper = true"
					>
						<PlusCircleIcon class="w-8 h-8" />
					</div>

					<WhisperBox
						v-for="whisper in whispers"
						:key="'whisper-' + whisper.id"
						:data="whisper"
						minified
						class="h-full"
						@click="
							() => {
								focusedWhisper = whisper;
							}
						"
					/>
				</div>
				<TabBar
					v-model="tab"
					:tabs="[
						{ name: 'Suggestions', value: 'suggest' },
						{ name: 'Abonné', value: 'following' },
						{ name: 'Hit Beams', value: 'hits' },
					]"
					class="md:w-fit md:mx-auto"
				/>
			</header>
			<main
				class="flex flex-col gap-4 overflow-visible"
				v-if="tab === 'suggest'"
			>
				<div class="flex flex-col -space-y-1 px-8">
					<h2 class="text-2xl font-bold">Feed</h2>
					<p class="text-muted">
						Publications tendances en ce moment
					</p>
				</div>
				<PostBox v-for="post in suggestions" :data="post" />
			</main>
			<main
				class="flex flex-col gap-4 overflow-visible"
				v-if="tab === 'following'"
			>
				<div class="flex flex-col -space-y-1 px-8">
					<h2 class="text-2xl font-bold">Abonnés</h2>
					<p class="text-muted">
						Publications des personnes que vous suivez
					</p>
				</div>
				<PostBox v-for="post in following" :data="post" />
			</main>
			<main
				class="flex flex-col gap-4 overflow-visible"
				v-if="tab === 'hits'"
			>
				<div class="flex flex-col -space-y-1 px-8">
					<h2 class="text-2xl font-bold">Hit Beams</h2>
					<p class="text-muted">
						Publications qui ont crevé les stats
					</p>
				</div>
				<PostBox v-for="post in hits" :data="post" />
			</main>
		</section>
		<aside
			id="suggestions"
			class="basis-1/3 sticky top-24 flex flex-col gap-4 overflow-y-auto p-4 max-md:order-0 md:p-8"
		>
			<!-- Profils -->
			<h2 class="text-2xl font-bold px-8">Suggestions</h2>
			<div class="flex flex-col gap-2">
				<ProfileBox
					v-for="user in users"
					:key="'user-' + user.id"
					:data="user"
					minified
				/>
			</div>
		</aside>
	</div>

	<!-- Focused Whisper -->
	<Menu
		@close="focusedWhisper = null"
		v-if="focusedWhisper"
		:title="
			'Pensée de ' +
			(focusedWhisper.profile.displayName ||
				'@' + focusedWhisper.profile.name ||
				'@ghost')
		"
		:actions="[
			{
				label: 'Voir le profil',
				icon: UserIcon,
				handler: '/@' + focusedWhisper.profile.name,
			},
			{
				label: 'Envoyer un message',
				icon: PaperAirplaneIcon,
				handler: () => {},
			},
			{
				label:
					'Bloquer ' +
					(focusedWhisper.profile.displayName ||
						focusedWhisper.profile.name),
				icon: NoSymbolIcon,
				danger: true,
				handler: () => {
					blockUser(focusedWhisper!.profile.id, refresh);
					focusedWhisper = null;
				},
			},
		]"
	>
		<WhisperBox
			:key="'whisper-' + focusedWhisper.id + '-focus'"
			:data="focusedWhisper"
		/>
	</Menu>

	<!-- New Whisper -->
	<Popup
		v-if="editingWhisper"
		@close="editingWhisper = false"
		title="Publier une pensée"
	>
		<h2 class="text-xl font-bold">Exprimer une pensée</h2>
		<WhisperBox
			:key="'whisper-' + newWhisper.id + '-edit'"
			:data="newWhisper"
			editable
		>
			<template #actions>
				<div
					class="cursor-pointer flex items-center gap-1 text-surface-text hover:underline"
					:style="{ color: newWhisper.textColor || undefined }"
					@click="isVisibilityMenuOpen = true"
				>
					<Component
						:is="visibilityOptions[newWhisper.visibility].icon"
						class="w-6 h-6"
					/>
					<span>
						{{ visibilityOptions[newWhisper.visibility].label }}
					</span>
				</div>
				<div class="grow"></div>
				<div
					class="cursor-pointer flex items-center gap-1 text-surface-text hover:underline"
					:style="{ color: newWhisper.textColor || undefined }"
					@click="handleNewWhisper"
				>
					<PaperAirplaneIcon class="w-6 h-6" />
				</div>
			</template>
		</WhisperBox>
		<div class="flex items-center gap-2 w-full max-w-lg px-8 py-1 overflow-x-auto scrollbar-none">
			<div
				key="whisper-color-default"
				class="shrink-0 flex items-center justify-center bg-surface text-surface-text h-10 p-2.5 aspect-square rounded-xl cursor-pointer transition-all duration-150 hover:scale-105"
				:style="{
					backgroundColor: revertColors ? '#102030' : undefined,
					color: revertColors ? '#ffffff' : undefined,
				}"
				@click="() => revertColors = !revertColors"
			>
				<ArrowPathIcon class="w-full h-full" />
			</div>
			<div
				key="whisper-color-default"
				class="shrink-0 flex items-center justify-center bg-surface text-surface-text h-10 p-2 aspect-square rounded-xl cursor-pointer transition-all duration-150 hover:scale-105"
				:style="{
					backgroundColor: revertColors ? '#102030' : undefined,
					color: revertColors ? '#ffffff' : undefined,
				}"
				@click="
					newWhisper.color = revertColors ? '#102030' : null;
					newWhisper.textColor = revertColors ? '#ffffff' : null;
				"
			>
				<ChatBubbleBottomCenterTextIcon class="w-full h-full" />
			</div>
			<div
				v-for="color in whisperColors"
				:key="'whisper-color-' + color.text + '-' + color.background"
				class="shrink-0 flex items-center justify-center h-10 p-2 aspect-square rounded-xl cursor-pointer transition-all duration-150 hover:scale-105"
				:style="{
					backgroundColor: revertColors
						? color.text
						: color.background,
					color: revertColors ? color.background : color.text,
				}"
				@click="
					newWhisper.color = revertColors
						? color.text
						: color.background;
					newWhisper.textColor = revertColors
						? color.background
						: color.text;
				"
			>
				<ChatBubbleBottomCenterTextIcon class="w-full h-full" />
			</div>
		</div>
	</Popup>

	<!-- Menu de visibilité -->
	<Menu
		v-if="isVisibilityMenuOpen"
		@close="isVisibilityMenuOpen = false"
		:title="'Visibilité de votre pensée'"
		:actions="[
			{
				label: 'Essai',
				description: 'Tout le monde sauf vos abonnés',
				icon: RocketLaunchIcon,
				handler: () => {
					newWhisper.visibility = 'outside';
				},
			},
			{
				label: 'Tout le monde',
				icon: GlobeAltIcon,
				handler: () => {
					newWhisper.visibility = 'everyone';
				},
			},
			{
				label: 'Abonnés',
				icon: UserGroupIcon,
				handler: () => {
					newWhisper.visibility = 'followers';
				},
			},
			{
				label: 'Amis',
				icon: HeartIcon,
				handler: () => {
					newWhisper.visibility = 'friends';
				},
			},
			{
				label: 'Privé',
				icon: EyeSlashIcon,
				handler: () => {
					newWhisper.visibility = 'me';
				},
			},
		]"
	/>
</template>
