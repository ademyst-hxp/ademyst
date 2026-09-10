<script setup lang="ts">
import Box from "~/components/base/Box.vue";
import Actions from "~/components/base/Actions.vue";
import Menu from "~/components/Menu.vue";

import {
	UserIcon,
	CheckBadgeIcon,
	GlobeAltIcon,
	KeyIcon,
	ShieldCheckIcon,
	BellSnoozeIcon,
	EyeIcon,
	ShareIcon,
	ChevronRightIcon,
	LightBulbIcon,
} from "@heroicons/vue/24/outline";

const { session, refresh } = useAuthSession();
await refresh();

if (!session.value) {
	navigateTo("/auth/login");
}

definePageMeta({
	title: "Paramètres | Ademyst",
	description: "Modifiez vos paramètres de compte et d'affichage.",
	middleware: ["auth"],
});

useHead({
	title: "Paramètres | Ademyst",
	meta: [
		{
			name: "description",
			content: "Modifiez vos paramètres de compte et d'affichage.",
		},
		{
			name: "keywords",
			content: "Beam, Ademyst, Paramètres",
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
</script>
<template>
	<Teleport to="#header">
		<h1 class="text-3xl font-bold text-center">Paramètres</h1>
	</Teleport>
	<section class="flex flex-col gap-2">
		<div class="flex gap-2 max-md:flex-col">
			<Box
				scale="sm"
				layout="horizontal"
				class="items-center w-full cursor-pointer hover:scale-101 duration-200 transition-transform"
				@click="navigateTo('/settings/profile')"
			>
				<div class="flex items-center gap-2 w-full">
					<UserIcon class="h-8 w-8" />
					<p class="grow text-lg font-medium">Profil</p>
					<LightBulbIcon class="h-5 w-5 text-yellow-400" />
					<ChevronRightIcon class="text-surface-text-muted h-5 w-5" />
				</div>
			</Box>
			<Box
				scale="sm"
				layout="horizontal"
				class="items-center w-full cursor-pointer hover:scale-101 duration-200 transition-transform"
				@click="navigateTo('/settings/appearance')"
			>
				<div class="flex items-center gap-2 w-full">
					<GlobeAltIcon class="h-8 w-8" />
					<p class="grow text-lg font-medium">Accessibilité</p>
					<LightBulbIcon class="h-5 w-5 text-yellow-400" />
					<ChevronRightIcon class="text-surface-text-muted h-5 w-5" />
				</div>
			</Box>
		</div>
	</section>
	<section class="flex flex-col gap-2">
		<h2 class="text-xl font-semibold px-8">Compte et profil</h2>
		<Actions
			scale="sm"
			:actions="[
				{
					label: 'Profil',
					icon: UserIcon,
					handler: '/settings/profile',
				},
				{
					label: 'Certifications et badges',
					icon: CheckBadgeIcon,
					handler: '/settings/badges',
				},
				{
					label: 'Compte et accès',
					icon: KeyIcon,
					handler: '/settings/account',
				},
			]"
		/>
	</section>
	<section class="flex flex-col gap-2">
		<h2 class="text-xl font-semibold px-8">Préférences</h2>
		<Actions
			scale="sm"
			:actions="[
				{
					label: 'Apparence et accessibilité',
					icon: EyeIcon,
					handler: '/settings/appearance',
				},
				{
					label: 'Confidentialité',
					icon: ShieldCheckIcon,
					handler: '/settings/privacy',
				},
				/*{
					label: 'Notifications et mails',
					icon: BellSnoozeIcon,
					handler: '/settings/mailing',
				},*/
			]"
		/>
	</section>
	<section class="flex flex-col gap-2">
		<h2 class="text-xl font-semibold px-8">Autres</h2>
		<Actions
			:actions="[
				{
					label: 'Inviter tes amis',
					icon: ShareIcon,
					handler: '/settings/invite',
				},
			]"
		/>
	</section>
</template>
