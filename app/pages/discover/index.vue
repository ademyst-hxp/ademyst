<script setup lang="ts">
import Navbar from "~/components/layout/Navbar.vue";
import StatusBox from "~/components/interactions/Status.vue";
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

import type { Status } from "~~/shared/models/interactions";

const { statuses, posts, users, refresh } = useFeed();
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

const tab = ref<"suggest" | "following" | "top" | "new">("suggest");
const focusedStatus = ref<Status | null>(null);
</script>
<template>
	<Navbar />
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

					<StatusBox
						v-for="status in statuses"
						:key="'status-' + status.id"
						:data="status"
						minified
						class="h-full"
						@click="focusedStatus = status"
					/>
				</div>
				<TabBar
					v-model="tab"
					:tabs="[
						{ name: 'Suggestions', value: 'suggest' },
						{ name: 'Abonné', value: 'following' },
						{ name: 'Hit Beams', value: 'top' },
						{ name: 'Écrire', value: 'new' },
					]"
					class="md:w-fit md:mx-auto"
				/>
			</header>
			<main class="flex flex-col gap-4 overflow-visible" v-if="tab === 'suggest'">
				<h2 class="text-2xl font-bold px-8">Feed</h2>
				<PostBox v-for="post in posts" :data="post" />
			</main>
			<main class="flex flex-col gap-4 overflow-visible" v-if="tab === 'following'">
				<h2 class="text-2xl font-bold px-8">Abonné</h2>
				<PostBox v-for="post in posts" :data="post" />
			</main>
			<main class="flex flex-col gap-4 overflow-visible" v-if="tab === 'top'">
				<h2 class="text-2xl font-bold px-8">Hit Beams</h2>
				<PostBox v-for="post in posts" :data="post" />
			</main>
			<main class="flex flex-col gap-4 overflow-visible" v-if="tab === 'new'">
				<h2 class="text-2xl font-bold px-8">Écrire une publication</h2>
				<PostBox v-for="post in posts" :data="post" />
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

	<!-- Focused Status -->
	<Menu
		@close="focusedStatus = null"
		v-if="focusedStatus"
		:title="
			'Statut de ' +
			(focusedStatus.profile.displayName ||
				'@' + focusedStatus.profile.name ||
				'@ghost')
		"
		:actions="[
			{
				label: 'Voir le profil',
				icon: UserIcon,
				handler: '/@' + focusedStatus.profile.name,
			},
			{
				label: 'Envoyer un message',
				icon: PaperAirplaneIcon,
				handler: () => {},
			},
			{
				label:
					'Bloquer ' +
					(focusedStatus.profile.displayName ||
						focusedStatus.profile.name),
				icon: NoSymbolIcon,
				danger: true,
				handler: () => { blockUser(focusedStatus!.profile.id, refresh); focusedStatus = null; },
			},
		]"
	>
		<StatusBox
			:key="'status-' + focusedStatus.id + '-focus'"
			:data="focusedStatus"
		/>
	</Menu>
</template>
