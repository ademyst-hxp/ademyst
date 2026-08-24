<script setup lang="ts">
import Logo from "~/assets/logo.svg";

import {
	FireIcon,
	PencilIcon,
	BellIcon,
	Cog6ToothIcon as Cog6ToothSolidIcon,
} from "@heroicons/vue/24/solid";

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

const { isSm } = useTWBreakpoints();

const isMenuOpen = ref(false);
const isSwitchAccountMenuOpen = ref(false);

const path = computed(() => useRoute().path);
</script>
<template>
	<nav
		v-if="isSm.value"
		id="navbar"
		class="_no_container fixed bottom-0 left-0 right-0 z-5000"
	>
		<div
			class="flex justify-between items-center bg-surface backdrop-blur-xl text-surface-text text-lg font-medium border-t border-surface-border h-20 px-8"
		>
			<RouterLink
				to="/write"
				class="flex items-center gap-1 transition-colors duration-200 rounded-full px-4 py-2 hover:text-primary"
				:class="path == '/write' ? 'bg-primary/15 text-primary' : ''"
			>
				<PencilIcon class="w-7 h-7" />
			</RouterLink>
			<RouterLink
				to="/inbox"
				class="flex items-center gap-1 transition-colors duration-200 rounded-full px-4 py-2 hover:text-primary"
				:class="path == '/inbox' ? 'bg-primary/15 text-primary' : ''"
			>
				<BellIcon class="w-7 h-7" />
			</RouterLink>
			<RouterLink
				to="/discover"
				class="flex items-center gap-1 transition-colors duration-200 rounded-full px-4 py-2 hover:text-primary"
				:class="path == '/discover' ? 'bg-primary/15 text-primary' : ''"
			>
				<FireIcon class="w-7 h-7" />
			</RouterLink>
			<RouterLink
				to="/settings"
				class="flex items-center gap-1 transition-colors duration-200 rounded-full px-4 py-2 hover:text-primary"
				:class="path == '/settings' ? 'bg-primary/15 text-primary' : ''"
			>
				<Cog6ToothSolidIcon class="w-7 h-7" />
			</RouterLink>
			<RouterLink
				v-if="session"
				:to="`/@${session?.profile.name}`"
				class="flex items-center gap-1 transition-colors duration-200 hover:text-primary"
			>
				<Avatar
					:src="`/api/v1/users/${session?.profile.name}/avatar.webp`"
					:color="
						path == `/@${session?.profile.name}` ? undefined : null
					"
				/>
			</RouterLink>
		</div>
	</nav>
	<nav v-else id="navbar" class="sticky top-4 z-5000 px-4">
		<div
			class="flex items-center gap-6 bg-surface backdrop-blur-xl text-surface-text text-lg font-medium border border-surface-border rounded-3xl h-[80px] px-8"
		>
			<RouterLink to="/">
				<Logo
					class="w-auto h-6 transition-colors duration-200 hover:text-primary"
				/>
			</RouterLink>
			<RouterLink
				to="/discover"
				class="flex items-center gap-1 transition-colors duration-200 hover:text-primary"
			>
				<FireIcon class="w-7 h-7" />
				Discover
			</RouterLink>
			<div class="grow"></div>
			<div
				v-if="session"
				class="cursor-pointer flex items-center gap-2 transition-colors duration-200 hover:text-primary"
				@click="isMenuOpen = !isMenuOpen"
			>
				<Avatar :src="`/api/v1/users/${session.profile.name}/avatar.webp`" />
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
			{ label: 'Paramètres', icon: Cog6ToothIcon, handler: '/settings' },
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
