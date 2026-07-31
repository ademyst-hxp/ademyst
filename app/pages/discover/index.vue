<script setup lang="ts">
import Navbar from "~/components/layout/Navbar.vue";
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
} from "@heroicons/vue/24/solid";

import type { Whisper } from "~~/shared/models/interactions";

const { whispers, suggestions, hits, following, users, refresh } = useFeed();
const { blockUser } = useRelations();

await refresh();

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
				<h2 class="text-2xl font-bold px-8">Mises à jour récentes</h2>
				<div
					class="flex justify-start items-stretch gap-4 rounded-3xl overflow-x-auto scrollbar-none w-full h-24"
				>
					<div
						class="shrink-0 flex items-center justify-center bg-surface text-surface-text-muted border border-dashed border-surface-border rounded-3xl w-36 p-4 md:w-48 md:p-8 cursor-pointer transition-all duration-150 hover:scale-98"
					>
						<PlusCircleIcon class="w-8 h-8" />
					</div>

					<WhisperBox
						v-for="whisper in whispers"
						:key="'whisper-' + whisper.id"
						:data="whisper"
						minified
						class="h-full"
						@click="focusedWhisper = whisper"
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
			<main class="flex flex-col gap-4 overflow-visible" v-if="tab === 'suggest'">
				<div class="flex flex-col -space-y-1 px-8">
					<h2 class="text-2xl font-bold">Feed</h2>
					<p class="text-muted">Publications tendances en ce moment</p>
				</div>
				<PostBox v-for="post in suggestions" :data="post" />
			</main>
			<main class="flex flex-col gap-4 overflow-visible" v-if="tab === 'following'">
				<div class="flex flex-col -space-y-1 px-8">
					<h2 class="text-2xl font-bold">Abonnés</h2>
					<p class="text-muted">Publications des personnes que vous suivez</p>
				</div>
				<PostBox v-for="post in following" :data="post" />
			</main>
			<main class="flex flex-col gap-4 overflow-visible" v-if="tab === 'hits'">
				<div class="flex flex-col -space-y-1 px-8">
					<h2 class="text-2xl font-bold">Hit Beams</h2>
					<p class="text-muted">Publications qui ont crevé les stats</p>
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
				handler: () => { blockUser(focusedWhisper!.profile.id, refresh); focusedWhisper = null; },
			},
		]"
	>
		<WhisperBox
			:key="'whisper-' + focusedWhisper.id + '-focus'"
			:data="focusedWhisper"
		/>
	</Menu>
</template>
