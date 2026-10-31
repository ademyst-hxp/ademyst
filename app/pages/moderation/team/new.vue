<script setup lang="ts">
import type { Profile } from "~~/shared/models/profiles";

import Box from "~/components/base/Box.vue";
import ProfileRow from "~/components/profile/ProfileRow.vue";

definePageMeta({
	title: "Ademyst: Gérer un membre de l'équipe",
	description: "Attribuer ou modifier le grade d'un membre de l'équipe.",
	middleware: ["auth", "moderation"],
});

useHead({
	title: "Ademyst: Gérer un membre de l'équipe",
	meta: [
		{
			name: "viewport",
			content: "width=device-width, initial-scale=1.0",
		},
		{
			name: "robots",
			content: "noindex, nofollow",
		},
	],
});

const route = useRoute();
const { session } = useAuthSession();
const { assign, findProfile } = useTeam();

const myLevel = computed(() => session.value?.profile.level ?? 0);

// Only grades strictly lower than the author's can be assigned.
const levelOptions = computed(() =>
	TEAM_LEVELS.filter((level) => level < myLevel.value).map((level) => ({
		label: getLevelLabel(level),
		value: String(level),
	})),
);

const username = ref(String(route.query.user ?? ""));
const profile = ref<Profile | null>(null);
const level = ref(levelOptions.value[0]?.value ?? "");
const name = ref("");
const reason = ref("");
const expiresAt = ref("");

const error = ref<string | null>(null);

const lookup = async () => {
	error.value = null;
	profile.value = await findProfile(username.value);

	if (!profile.value) {
		error.value = "Aucun profil ne correspond à ce nom.";
		return;
	}

	// Pre-select the current grade when the member is already in the team.
	if (profile.value.level > 5 && profile.value.level < myLevel.value) {
		level.value = String(profile.value.level);
	}
};

if (username.value) {
	await lookup();
}

const targetIsLocked = computed(
	() => !!profile.value && profile.value.level >= myLevel.value,
);

const submit = async () => {
	error.value = null;

	if (!profile.value || targetIsLocked.value || !level.value) return;

	try {
		await assign(Number(level.value), profile.value.id, {
			name: name.value,
			reason: reason.value,
			expiresAt: expiresAt.value
				? new Date(expiresAt.value).toISOString()
				: undefined,
		});

		await navigateTo("/moderation/team");
	} catch (err) {
		error.value = err instanceof Error ? err.message : String(err);
		throw err;
	}
};
</script>
<template>
	<Teleport to="#header">
		<h1 class="text-3xl font-bold text-center font-title">
			Gérer un membre
		</h1>
	</Teleport>

	<section class="space-y-2">
		<div class="flex items-center px-8">
			<h2 class="grow text-2xl font-bold">Attribuer un grade</h2>
			<Button
				label="Retour"
				variant="secondary"
				size="small"
				:handler="'/moderation/team'"
			/>
		</div>

		<Box>
			<div class="flex items-end gap-2">
				<div class="grow">
					<Input
						v-model="username"
						label="Nom d'utilisateur"
						placeholder="@nom"
						required
						@enter="lookup"
					/>
				</div>
				<Button label="Rechercher" size="medium" :handler="lookup" />
			</div>

			<ProfileRow v-if="profile" :data="profile" class="mt-2" />

			<p v-if="targetIsLocked" class="text-danger">
				Ce membre a un grade supérieur ou égal au vôtre : vous ne pouvez
				pas le modifier.
			</p>
		</Box>

		<Box v-if="profile && !targetIsLocked">
			<form class="flex flex-col gap-4" @submit.prevent="() => {}">
				<InlineSelect
					v-model="level"
					id="level"
					label="Grade"
					:options="levelOptions"
					class="px-0!"
				/>
				<Input
					v-model="name"
					label="Intitulé (facultatif)"
					placeholder="Moderator Assignment"
				/>
				<Input
					v-model="reason"
					type="textarea"
					label="Raison (facultatif)"
					placeholder="Pourquoi ce grade est attribué"
				/>
				<Input
					v-model="expiresAt"
					type="datetime-local"
					label="Date d'expiration (facultatif)"
				/>

				<p v-if="error" class="text-danger">{{ error }}</p>

				<Button
					label="Enregistrer"
					size="medium"
					:handler="submit"
				/>
			</form>
		</Box>

		<p v-else-if="error" class="px-8 text-danger">{{ error }}</p>
	</section>
</template>
