<script setup lang="ts">
import { UserPlusIcon } from "@heroicons/vue/24/outline";
import Box from "../base/Box.vue";
import Popup from "../base/Popup.vue";

import Avatar from "../profile/Avatar.vue";

const { sessions, activeSession, switchSession } = useAuthSession();

const emit = defineEmits<{
	(e: "close"): void;
}>();

const close = () => {
	emit("close");
};

const handleSwitchSession = async (sessionId: string) => {
	const nextSession = await switchSession(sessionId);
	close();

	if (nextSession) {
		await navigateTo('/discover');
	}
};

const handleAddAccount = async () => {
	close();
	await navigateTo("/auth/login");
};
</script>
<template>
	<Popup>
		<slot />
		<Box class="items-center w-full max-h-full sm:w-lg">
			<h2 class="text-3xl font-medium text-surface-text mb-4">
				Changer de compte
			</h2>
			<div
				class="flex flex-col items-start gap-4 text-xl overflow-y-auto w-full"
			>
				<div
					v-for="session in sessions"
					:key="session.id"
					:class="[
						'flex items-center gap-2 transition-colors duration-200 hover:underline cursor-pointer',
						session.id === activeSession?.id ? 'text-primary' : '',
					]"
					@click="handleSwitchSession(session.id)"
				>
					<Avatar />
					{{ session.profile.displayName || session.profile.name }}
				</div>
				<div
					class="flex items-center gap-2 transition-colors duration-200 hover:underline cursor-pointer"
					@click="handleAddAccount"
				>
					<UserPlusIcon class="w-6 h-6" />
					Ajouter un compte
				</div>
				<div
					class="flex items-center self-center font-medium gap-2 transition-colors duration-200 hover:underline cursor-pointer"
					@click="close()"
				>
					Fermer
				</div>
			</div>
		</Box>
	</Popup>
</template>
