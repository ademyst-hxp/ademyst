<script setup lang="ts">
import { BuildingOffice2Icon, MapPinIcon } from "@heroicons/vue/24/solid";
import {
	FlagIcon,
	ScaleIcon,
	HeartIcon,
	UserMinusIcon,
	EllipsisVerticalIcon,
	ShareIcon,
	AtSymbolIcon,
} from "@heroicons/vue/24/outline";

import PostView from "@/components/interactions/Post.vue";
import ProfileReportBox from "@/components/moderation/ProfileReport.vue";
import SocialIcon from "@/components/profile/SocialIcon.vue";
import BadgeInfo from "@/components/profile/BadgeInfo.vue";

import type { Profile } from "~~/shared/models/profiles";
import type { Post } from "~~/shared/models/interactions";
import type { ProfileReport } from "~~/shared/models/reports";
import type { Badge } from "~~/shared/models/shop";

type Relationship = {
	me: boolean;
	following: boolean;
	followed: boolean;
	friend: boolean;
	blocking: boolean;
};

type ProfileResponse = {
	status: "ok";
	profile: Profile;
};

const route = useRoute();
const { $api } = useNuxtApp();

const { followUser, unfollowUser, friendUser, unfriendUser } = useRelations();

const { session, refresh: refreshSession } = useAuthSession();

await refreshSession();

const name = computed(() => {
	const raw = route.params.name;
	return Array.isArray(raw) ? raw[0] : raw;
});

const requestKey = computed(() => `profile-${name.value ?? "missing"}`);
const postsRequestKey = computed(() => `posts-${name.value ?? "missing"}`);

const { data, pending } = await useAsyncData(requestKey, async () => {
	if (!name.value) throw createError({ statusCode: 400 });

	return $api<ProfileResponse>(`/users/${encodeURIComponent(name.value)}`);
});

const { data: posts } = await useAsyncData(postsRequestKey, async () => {
	if (!name.value) throw createError({ statusCode: 400 });

	return (
		await $api<{ posts: Post[] }>(
			`/users/${encodeURIComponent(name.value)}/posts`,
		)
	).posts;
});

const profile = computed(() => data.value?.profile ?? null);
const stats = computed(
	() => profile.value?.stats ?? { following: 0, followers: 0 },
);
const relationship = computed<Relationship>(
	() =>
		data.value?.profile.relationships ?? {
			me: false,
			following: false,
			followed: false,
			friend: false,
			blocking: false,
		},
);

const isMe = computed(() => relationship.value.me);
const canFollow = computed(
	() =>
		!relationship.value.me &&
		!relationship.value.following &&
		!relationship.value.blocking,
);

/*********************/

const newReport = ref<ProfileReport>({
	id: "",
	reason: "",
	details: "",
	status: "pending",
	reporter: {
		id: "",
		email: "",
		createdAt: new Date(),
		confirmedAt: new Date(),
		updatedAt: new Date(),
	},
	reportedProfile: profile.value ?? {
		id: "",
		name: "",
		displayName: "",
		bio: "",
		location: "",
		corporation: "",
		birthday: null,
		pronouns: null,
		links: [],
		badge: null,
		badges: [],
		level: 0,
		stats: { following: 0, followers: 0 },
		relationships: {
			me: false,
			following: false,
			followed: false,
			friend: false,
			blocking: false,
		},
		createdAt: new Date(),
	},
	createdAt: new Date(),
});

const submitReport = async () => {
	if (!profile.value) return;

	const response = await $api<ProfileReport>(
		`/users/${encodeURIComponent(profile.value.name)}/report`,
		{
			method: "POST",
			body: newReport.value,
		},
	);

	if (response) {
		newReport.value = response;
	}
};

/*********************/

const tab = ref("posts");

const tabs = computed<{ name: string; value: string }[]>(() => {
	let _tabs = [
		{ name: "Publications", value: "posts" },
		{ name: "Suivis", value: "follows" },
		{ name: "Abonnés", value: "followers" },
	];

	return _tabs;
});

const profileMenuOptions = computed<
	{
		label: string;
		description?: string;
		icon?: Component;
		danger?: boolean;
		handler: string | (() => void);
	}[]
>(() => {
	const options: {
		label: string;
		description?: string;
		icon?: Component;
		danger?: boolean;
		handler: string | (() => void);
	}[] = [
		{
			label: "Partager le profil",
			icon: ShareIcon,
			handler: () => {
				navigator.clipboard.writeText(
					`https://beam.ejnalo.me/@${profile.value?.name}`,
				);
				alert("Lien copié dans le presse-papiers !");
			},
		},
		{
			label: "Copier le nom d'utilisateur",
			icon: AtSymbolIcon,
			handler: () => {
				navigator.clipboard.writeText(profile.value?.name ?? "");
				alert("Lien copié dans le presse-papiers !");
			},
		},
	];

	if (relationship.value.friend) {
		options.push({
			label: "Supprimer un ami",
			icon: UserMinusIcon,
			handler: () => {
				unfriendUser(profile.value!.name, () => {
					relationship.value.friend = false;
				});
			},
		});
	} else if (relationship.value.following) {
		options.push({
			label: "Ajouter en ami",
			description: `${profile.value?.displayName || profile.value?.name} pourra voir des publications exclusives.`,
			icon: HeartIcon,
			handler: () => {
				friendUser(profile.value!.name, () => {
					relationship.value.friend = true;
				});
			},
		});
	}

	if (!relationship.value.me) {
		options.push({
			label: "Signaler le profil",
			icon: FlagIcon,
			danger: true,
			handler: () => {
				newReport.value.reportedProfile = profile.value!;
				tab.value = "report";
			},
		});
	}

	if ((session.value?.profile.level ?? 0) >= 6) {
		options.push({
			label: "Modérer le profil",
			icon: ScaleIcon,
			handler: () => {
				navigateTo(`/@${profile.value?.name}/moderate`);
			},
		});
	}

	return options;
});

const isProfileMenuOpen = ref(false);

const focusedBadge = ref<Badge | null>(null);
</script>
<template>
	<div class="mx-auto max-w-7xl lg:flex lg:gap-8">
		<header
			class="p-6 px-8 space-y-6 md:p-8 lg:w-1/2 xl:w-1/3 lg:sticky lg:top-24 lg:self-start"
		>
			<div class="flex gap-4 items-center">
				<img
					:src="`/api/v1/users/${profile?.name}/avatar.webp`"
					class="w-24 h-24 rounded-full"
				/>

				<div class="-space-y-2">
					<div
						v-if="pending"
						class="bg-muted rounded-full h-3 w-32 animate-pulse"
					/>

					<h1
						v-else
						class="flex items-center gap-2 text-3xl font-bold"
					>
						{{
							profile?.displayName ??
							(profile?.name ? `@${profile.name}` : "Ghost")
						}}
						<img
							v-if="profile?.badge"
							:src="`/api/v1/badges/${profile?.badge?.id}/icon.png`"
							:alt="profile?.badge?.name"
							class="h-6 w-6"
						/>
					</h1>

					<div
						v-if="pending"
						class="bg-muted rounded-full h-3 w-24 animate-pulse"
					/>

					<span v-else class="text-muted text-lg font-semibold">
						{{ `@${profile?.name ?? "ghost"}` }}
					</span>
				</div>
			</div>

			<div
				v-if="profile?.badges && profile?.badges.length > 0"
				class="flex items-center gap-1.5 px-4"
			>
				<template :key="badge.id" v-for="badge in profile?.badges">
					<img
						:src="`/api/v1/badges/${badge.id}/icon.png`"
						:alt="badge.name"
						class="cursor-pointer h-5 w-5"
						@click="focusedBadge = badge"
					/>
				</template>
			</div>

			<div class="flex items-center gap-4 px-4">
				<div class="flex flex-col w-1/3 -space-y-1">
					<span class="text-2xl font-bold">{{
						posts?.length ?? 0
					}}</span>
					<span class="text-muted">Publications</span>
				</div>

				<div class="flex flex-col w-1/3 -space-y-1">
					<span class="text-2xl font-bold">{{
						stats.following
					}}</span>
					<span class="text-muted">Suivis</span>
				</div>

				<div class="flex flex-col w-1/3 -space-y-1">
					<span class="text-2xl font-bold">{{
						stats.followers
					}}</span>
					<span class="text-muted">Abonnés</span>
				</div>
			</div>

			<div v-if="profile" class="flex flex-wrap gap-2 items-center">
				<Button
					v-if="isMe"
					label="Modifier le profil"
					size="medium"
					handler="/settings/profile"
				/>

				<Button
					v-if="canFollow"
					label="Suivre"
					size="medium"
					:handler="
						() =>
							followUser(profile!.name, () => {
								relationship.following = true;
							})
					"
				/>

				<Button
					v-else-if="relationship.following"
					label="Se désabonner"
					variant="secondary"
					size="medium"
					:handler="
						() =>
							unfollowUser(profile!.name, () => {
								relationship.following = false;
							})
					"
				/>

				<Button
					:icon="EllipsisVerticalIcon"
					size="medium"
					variant="secondary"
					:handler="() => (isProfileMenuOpen = !isProfileMenuOpen)"
				/>
			</div>

			<p v-if="profile?.bio" class="text-muted px-4">
				{{ profile.bio }}
			</p>

			<ul
				v-if="profile?.location || profile?.corporation"
				class="space-y-1 px-4"
			>
				<li v-if="profile.location" class="flex items-center gap-1">
					<MapPinIcon class="w-5 h-5 text-muted" />
					{{ profile.location }}
				</li>

				<li v-if="profile.corporation" class="flex items-center gap-1">
					<BuildingOffice2Icon class="w-5 h-5 text-muted" />
					{{ profile.corporation }}
				</li>
			</ul>

			<ul class="flex flex-col items-start gap-1 px-4">
				<a
					class="flex items-center gap-2 cursor-pointer text-muted group"
					v-for="link in profile?.links ?? []"
					:href="link.url"
					target="_blank"
				>
					<SocialIcon :icon="link.type" class="w-5 h-5" />
					<p class="grow font-medium group-hover:underline">
						{{ link.resourceName || link.name || link.url }}
					</p>
				</a>
			</ul>
		</header>
		<main
			class="flex flex-col gap-4 max-lg:p-4 lg:w-1/2 xl:w-2/3 md:p-8 min-w-0"
		>
			<div class="lg:flex lg:justify-end">
				<TabBar v-model="tab" :tabs="tabs" />
			</div>

			<section v-if="tab === 'posts'" class="space-y-4">
				<PostView
					v-for="post in posts ?? []"
					:key="post.id"
					:data="post"
				/>
			</section>

			<section v-if="tab === 'report'" class="space-y-4">
				<ProfileReportBox
					:key="newReport.id"
					:data="newReport"
					:editable="true"
				>
					<template #edit-actions>
						<Button
							label="Signaler"
							:icon="FlagIcon"
							variant="danger"
							:handler="submitReport"
						/>
					</template>
				</ProfileReportBox>
			</section>
		</main>
	</div>
	<Menu
		v-if="isProfileMenuOpen"
		label="Plus d'options"
		:actions="profileMenuOptions"
		@close="isProfileMenuOpen = false"
	/>
	<BadgeInfo
		v-if="focusedBadge"
		:badge="focusedBadge"
		@close="focusedBadge = null"
	/>
</template>
