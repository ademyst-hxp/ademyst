<script setup lang="ts">
import Logo from "~/assets/logo.svg";

import {
	FireIcon,
	PaperAirplaneIcon,
	BellIcon,
	Cog6ToothIcon as Cog6ToothSolidIcon,
} from "@heroicons/vue/24/outline";

import {
	UserIcon,
	Cog6ToothIcon,
	ArrowsRightLeftIcon,
	ArrowRightEndOnRectangleIcon,
} from "@heroicons/vue/24/outline";

import Menu from "../Menu.vue";
import Avatar from "../profile/Avatar.vue";
import SwitchAccountMenu from "./SwitchAccountMenu.vue";

const { refresh, session } = useAuthSession();
refresh();

const { data: notifications, refresh: refreshNotifications } = useAsyncData(
	"notifications-count",
	async () => {
		const response = await $fetch<{
			critical: number;
			total: number;
			endpoints: {
				[key: string]: string;
			};
		}>("/api/v1/inbox/count");
		return response;
	},
);

const isMenuOpen = ref(false);
const isSwitchAccountMenuOpen = ref(false);

const path = computed(() => useRoute().path);
</script>
<template>
	<nav
		id="navbar"
		class="_no_container fixed bottom-4 left-0 right-0 z-5000 max-md:px-4 md:sticky md:top-4"
	>
		<div
			class="md:hidden flex items-center justify-between bg-surface backdrop-blur-xl text-surface-text text-lg font-medium border border-surface-border rounded-full h-16 px-3 md:px-8 md:gap-6 md:rounded-3xl md:h-20"
		>
			<!-- Mobile -->
			<RouterLink
				to="/settings"
				class="flex items-center gap-1 rounded-full px-4 py-2 transition-colors duration-200 hover:text-primary"
				:class="path === '/inbox' ? 'bg-primary/15 text-primary' : ''"
			>
				<BellIcon class="w-7 h-7" />
				<div
					v-if="notifications?.critical"
					class="bg-danger rounded-full w-2 h-2 animate-pulse"
				/>
				<div
					v-else-if="notifications?.total"
					class="bg-warning rounded-full w-2 h-2"
				/>
			</RouterLink>

			<RouterLink
				to="/write"
				class="flex items-center gap-1 rounded-full px-4 py-2 transition-colors duration-200 hover:text-primary"
				:class="path === '/write' ? 'bg-primary/15 text-primary' : ''"
			>
				<PaperAirplaneIcon class="w-7 h-7" />
			</RouterLink>

			<RouterLink
				to="/discover"
				class="flex items-center gap-1 rounded-full px-4 py-2 transition-colors duration-200 hover:text-primary"
				:class="
					path === '/discover' ? 'bg-primary/15 text-primary' : ''
				"
			>
				<FireIcon class="w-7 h-7" />
			</RouterLink>

			<RouterLink
				to="/settings"
				class="flex items-center gap-1 rounded-full px-4 py-2 transition-colors duration-200 hover:text-primary"
				:class="
					path === '/settings' ? 'bg-primary/15 text-primary' : ''
				"
			>
				<Cog6ToothSolidIcon class="w-7 h-7" />
			</RouterLink>

			<RouterLink
				v-if="session"
				:to="`/@${session.profile.name}`"
				class="flex items-center gap-1 transition-colors duration-200 hover:text-primary"
			>
				<Avatar
					:src="`/api/v1/users/${session.profile.name}/avatar.webp`"
					:color="
						path === `/@${session.profile.name}` ? undefined : null
					"
				/>
			</RouterLink>
		</div>

		<!-- Desktop -->
		<div
			class="max-md:hidden flex items-center justify-between bg-surface backdrop-blur-xl text-surface-text text-lg font-medium border border-surface-border rounded-full h-16 px-3 md:px-8 md:gap-6 md:rounded-3xl md:h-20"
		>
			<RouterLink to="/">
				<Logo
					class="w-auto h-5 transition-colors duration-200 hover:text-primary"
				/>
			</RouterLink>

			<RouterLink
				to="/discover"
				class="flex items-center gap-1 transition-colors duration-200 hover:text-primary"
			>
				<FireIcon class="w-7 h-7" />
				Discover
			</RouterLink>

			<RouterLink
				to="/write"
				class="flex items-center gap-1 transition-colors duration-200 hover:text-primary"
			>
				Écrire
			</RouterLink>

			<div class="grow" />

			<RouterLink
				to="/inbox"
				class="flex items-center gap-1 rounded-full px-4 py-2 transition-colors duration-200 hover:text-primary"
				:class="
					notifications?.critical
						? 'bg-danger/15 text-danger'
						: notifications?.total
							? 'bg-warning/15 text-warning'
							: ''
				"
			>
				<BellIcon class="w-7 h-7" />
				<div
					v-if="notifications?.critical"
					class="bg-danger rounded-full w-2 h-2 animate-pulse"
				/>
				<div
					v-else-if="notifications?.total"
					class="bg-warning rounded-full w-2 h-2"
				/>
			</RouterLink>

			<div
				v-if="session"
				class="cursor-pointer flex items-center gap-2 transition-colors duration-200 hover:text-primary"
				@click="isMenuOpen = !isMenuOpen"
			>
				<Avatar
					:src="`/api/v1/users/${session.profile.name}/avatar.webp`"
				/>
				{{ session.profile.displayName || session.profile.name }}
			</div>
		</div>
	</nav>

	<Menu
		v-if="session && isMenuOpen"
		:title="session.profile.displayName || session.profile.name"
		:actions="[
			{
				label: 'Mon profil',
				icon: UserIcon,
				handler: '/@' + session.profile.name,
			},
			{
				label: 'Paramètres',
				icon: Cog6ToothIcon,
				handler: '/settings',
			},
			{
				label: 'Changer de compte',
				icon: ArrowsRightLeftIcon,
				handler: () => {
					isSwitchAccountMenuOpen = true;
				},
			},
			{
				label: 'Déconnexion',
				icon: ArrowRightEndOnRectangleIcon,
				danger: true,
				handler: '/logout',
			},
		]"
		@close="isMenuOpen = false"
	/>

	<SwitchAccountMenu
		v-if="session && isSwitchAccountMenuOpen"
		@close="isSwitchAccountMenuOpen = false"
	/>
</template>
