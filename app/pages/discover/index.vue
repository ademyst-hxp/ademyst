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
	ClockIcon,
} from "@heroicons/vue/24/outline";

import {
	GlobeAltIcon,
	RocketLaunchIcon,
	UserGroupIcon,
	HeartIcon,
	EyeSlashIcon,
} from "@heroicons/vue/24/outline";

import WhisperFeatherIcon from "~/assets/whispers-feather.svg";

import type { Whisper } from "~~/shared/models/interactions";
import type { FeedTab } from "~/composables/useFeed";
import Popup from "~/components/base/Popup.vue";

const { $api } = useNuxtApp();

const { session, refresh: refreshSession } = useAuthSession();
const { whispers, suggestions, hits, following, users, refresh, loadTab } =
	useFeed();
const { blockUser } = useRelations();

const tab = ref<FeedTab>("following");

const refreshFeed = () => refresh(tab.value);

await refreshSession();

const profile = session.value?.profile;

if (!profile) {
	await navigateTo("/auth/login");
}

// Fetched once on the server and reused from the payload when hydrating,
// instead of running again in the browser.
await useAsyncData("discover-feed", async () => {
	await refreshFeed();

	return true;
});

watch(tab, (value) => loadTab(value));

definePageMeta({
	title: "Ademyst: Discover",
	description: "Découvrez des publications avec Ademyst Discover !",
	middleware: ["auth"],
});

useHead({
	title: "Ademyst: Discover",
	meta: [
		{
			name: "description",
			content: "Découvrez des publications avec Ademyst Discover !",
		},
		{
			name: "keywords",
			content: "Beam, Ademyst, Discover",
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
	profile: profile!,
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

	await refreshFeed();
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
	<Teleport to="#header">
		<h1 class="text-3xl font-bold text-center font-title">Discover</h1>
		<TabBar
			v-model="tab"
			:tabs="[
				{ name: 'Abonnements', value: 'following' },
				{ name: 'Suggestions', value: 'suggest' },
				{ name: 'Hits', value: 'hits' },
			]"
		/>
	</Teleport>

	<section class="flex flex-col gap-2">
		<div
			class="flex justify-start items-stretch gap-2 rounded-3xl overflow-x-auto scrollbar-none w-full h-24"
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
	</section>
	<section
		class="flex flex-col gap-2 overflow-visible"
		v-if="tab === 'following'"
	>
		<template
			v-for="(post, index) in following"
			:key="'following-' + post.id"
		>
			<PostBox :data="post" />

			<div
				v-if="(index + 1) % 25 === 0"
				class="flex flex-col items-center gap-2 text-center py-8"
			>
				<ClockIcon class="w-24 h-24 text-muted/50 mx-auto" />
				<h2 class="text-2xl font-bold font-title px-8">Une petite pause ?</h2>
				<p class="text-muted px-8">
					Vous avez parcouru {{ index + 1 }} publications depuis
					l'ouverture de cette page.
				</p>
			</div>
			<div
				v-else-if="(index + 1) % 13 === 0"
				class="flex flex-col gap-2 py-4"
			>
				<h2 class="text-2xl font-bold font-title px-8">Profils à suivre</h2>
				<div class="flex gap-4 h-96 overflow-x-auto scrollbar-none">
					<ProfileBox
						v-for="user in users"
						:key="'hits-suggestion-' + user.id"
						:data="user"
						class="cursor-pointer shrink-0"
						@click.self="
							() => {
								focusedWhisper = null;
								navigateTo('/@' + user.name);
							}
						"
					/>
				</div>
			</div>
		</template>
	</section>

	<section
		class="flex flex-col gap-2 overflow-visible"
		v-if="tab === 'suggest'"
	>
		<template
			v-for="(post, index) in suggestions"
			:key="'suggest-' + post.id"
		>
			<PostBox :data="post" />

			<div
				v-if="(index + 1) % 25 === 0"
				class="flex flex-col items-center gap-2 text-center py-8"
			>
				<ClockIcon class="w-24 h-24 text-muted/50 mx-auto" />
				<h2 class="text-2xl font-bold font-title px-8">Une petite pause ?</h2>
				<p class="text-muted px-8">
					Vous avez parcouru {{ index + 1 }} publications depuis
					l'ouverture de cette page.
				</p>
			</div>
			<div
				v-else-if="(index + 1) % 9 === 0"
				class="flex flex-col gap-2 py-4"
			>
				<h2 class="text-2xl font-bold font-title px-8">Profils à suivre</h2>
				<div class="flex gap-4 h-96 overflow-x-auto scrollbar-none">
					<ProfileBox
						v-for="user in users"
						:key="'hits-suggestion-' + user.id"
						:data="user"
						class="cursor-pointer shrink-0"
						@click.self="
							() => {
								focusedWhisper = null;
								navigateTo('/@' + user.name);
							}
						"
					/>
				</div>
			</div>
		</template>
	</section>

	<section class="flex flex-col gap-2 overflow-visible" v-if="tab === 'hits'">
		<PostBox v-for="post in hits" :key="'hits-' + post.id" :data="post" />
	</section>

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
					blockUser(focusedWhisper!.profile.id, refreshFeed);
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
	<Popup v-if="editingWhisper" @close="editingWhisper = false">
		<h2 class="text-xl font-bold font-title">Exprimer une pensée</h2>
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
		<div
			class="flex items-center gap-2 w-full max-w-lg px-8 py-1 overflow-x-auto scrollbar-none"
		>
			<div
				key="whisper-color-default"
				class="shrink-0 flex items-center justify-center bg-whispers-text text-whispers h-10 p-2.5 aspect-square rounded-xl cursor-pointer transition-all duration-150 hover:scale-105"
				@click="
					() => {
						newWhisper.color = null;
						newWhisper.textColor = null;
					}
				"
			>
				<WhisperFeatherIcon class="w-full h-full" />
			</div>
			<div
				key="whisper-color-revert"
				class="shrink-0 flex items-center justify-center bg-surface text-surface-text h-10 p-2.5 aspect-square rounded-xl cursor-pointer transition-all duration-150 hover:scale-105"
				:style="{
					backgroundColor: revertColors ? '#102030' : undefined,
					color: revertColors ? '#ffffff' : undefined,
				}"
				@click="() => (revertColors = !revertColors)"
			>
				<ArrowPathIcon class="w-full h-full" />
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
