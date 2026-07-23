<script setup lang="ts">
import Logo from "~/assets/logo.svg";

import {
	FireIcon,
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

const isMenuOpen = ref(false);
const isSwitchAccountMenuOpen = ref(false);
</script>
<template>
	<nav id="navbar" class="sticky top-4 px-4 mb-4 z-5000">
		<div
			class="flex items-center gap-6 bg-surface backdrop-blur-xl text-surface-text text-lg font-medium border border-surface-border rounded-3xl h-20 px-8"
		>
			<RouterLink to="/"
				><Logo
					class="w-auto h-4 transition-colors duration-200 hover:text-primary"
			/></RouterLink>
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
				<Avatar />
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
