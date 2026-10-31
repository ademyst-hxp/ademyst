<script setup lang="ts">
import type { LevelEntitlement } from "~~/shared/models/entitlements";

import { ArrowPathIcon, PlusIcon } from "@heroicons/vue/24/outline";

import Table from "~/components/base/Table.vue";
import Box from "~/components/base/Box.vue";
import ProfileRow from "~/components/profile/ProfileRow.vue";

definePageMeta({
	title: "Ademyst: Équipe de modération",
	description: "Gestion des membres de l'équipe de modération d'Ademyst.",
	middleware: ["auth", "moderation"],
});

useHead({
	title: "Ademyst: Équipe de modération",
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

const { session } = useAuthSession();
const { fetchPage, remove } = useTeam();

const myLevel = computed(() => session.value?.profile.level ?? 0);

// A member can only be managed by a strictly higher grade (same rule as API).
const canManage = (member: LevelEntitlement) =>
	member.profile.level < myLevel.value;

const tab = ref<string>("all");

const tabs = [
	{ name: "Tous", value: "all" },
	...TEAM_LEVELS.map((level) => ({
		name: getLevelLabel(level),
		value: String(level),
	})),
];

const currentLevel = () => (tab.value === "all" ? "all" : Number(tab.value));

const { items, hasNext, loadingMore, reset, loadMore } =
	usePaginatedList<LevelEntitlement>(async (offset) => {
		const response = await fetchPage(currentLevel(), offset);

		return {
			items: response.memberships,
			next: response.next,
			hasNext: response.hasNext,
		};
	});

const actionError = ref<string | null>(null);

// The first page goes through the payload so that the list is already there
// when hydrating; usePaginatedList then takes over for the next pages.
const {
	data: firstPage,
	pending,
	error: loadError,
	refresh,
} = await useAsyncData(
	`moderation-team-${tab.value}`,
	async () => {
		const response = await fetchPage(currentLevel(), 0);

		return {
			items: response.memberships,
			next: response.next,
			hasNext: response.hasNext,
		};
	},
	{ watch: [tab] },
);

watch(firstPage, (page) => reset(page), { immediate: true });

const error = computed(() => actionError.value ?? loadError.value?.message);

const { sentinel, recheck } = useScrollSentinel(
	() => loadMore(),
	() => hasNext.value,
);

watch(pending, (value) => {
	if (!value) recheck();
});

const formatDate = (value: string | Date | null) =>
	value
		? new Date(value).toLocaleString("fr-FR", {
				day: "2-digit",
				month: "long",
				year: "numeric",
			})
		: "Jamais";

const toRemove = ref<LevelEntitlement | null>(null);

const confirmRemove = async () => {
	const member = toRemove.value;

	if (!member) return;

	actionError.value = null;

	try {
		await remove(member.level.id, member.profile.id);
		items.value = items.value.filter((item) => item.id !== member.id);
	} catch (err) {
		actionError.value = err instanceof Error ? err.message : String(err);
	}
};
</script>
<template>
	<Teleport to="#header">
		<h1 class="text-3xl font-bold text-center font-title">
			Équipe de modération
		</h1>
		<TabBar v-model="tab" :tabs="tabs" />
	</Teleport>

	<section class="flex items-center gap-2 px-8">
		<p class="grow text-muted">
			{{ items.length }} membre{{ items.length > 1 ? "s" : "" }} affiché{{
				items.length > 1 ? "s" : ""
			}}
		</p>
		<Button
			label="Actualiser"
			variant="secondary"
			size="small"
			:icon="ArrowPathIcon"
			:handler="() => refresh()"
		/>
		<Button
			label="Ajouter"
			size="small"
			:icon="PlusIcon"
			:handler="'/moderation/team/new'"
		/>
	</section>

	<Box v-if="error" scale="sm" class="text-danger">
		<p>{{ error }}</p>
	</Box>

	<Table>
		<template #head>
			<tr>
				<th>Membre</th>
				<th>Grade</th>
				<th class="max-md:hidden">Raison</th>
				<th class="max-md:hidden">Expiration</th>
				<th class="max-md:hidden" />
			</tr>
		</template>
		<template #body>
			<tr v-if="!pending && items.length === 0">
				<td colspan="5" class="text-muted text-center">
					Aucun membre dans cette catégorie.
				</td>
			</tr>
			<tr v-for="member in items" :key="member.id">
				<td><ProfileRow :data="member.profile" /></td>
				<td>{{ getLevelLabel(member.level.id) }}</td>
				<td class="max-md:hidden">
					{{ member.reason }}
				</td>
				<td class="max-md:hidden">
					{{
						member.expiresAt
							? formatDate(new Date(member.expiresAt))
							: "Jamais"
					}}
				</td>
				<td class="max-md:hidden">
					<div
						v-if="canManage(member)"
						class="flex items-center justify-end gap-2"
					>
						<Button
							label="Modifier"
							variant="secondary"
							size="small"
							:handler="`/moderation/team/new?user=${member.profile.name}`"
						/>
						<Button
							label="Retirer"
							variant="danger"
							size="small"
							:handler="() => (toRemove = member)"
						/>
					</div>
				</td>
			</tr>
		</template>
	</Table>

	<!-- Pagination sentinel -->
	<div ref="sentinel" class="flex justify-center py-6 text-muted">
		<ArrowPathIcon
			v-if="loadingMore || pending"
			class="w-6 h-6 animate-spin"
		/>
		<p v-else-if="!hasNext" class="text-sm">
			Vous avez tout vu pour le moment.
		</p>
	</div>

	<Dialog
		v-if="toRemove"
		title="Retirer ce membre ?"
		:description="`@${toRemove.profile.name} perdra son grade ${getLevelLabel(toRemove.level.id)} et ses permissions de modération.`"
		:actions="[
			{ label: 'Annuler', variant: 'secondary', handler: () => {} },
			{ label: 'Retirer', variant: 'danger', handler: confirmRemove },
		]"
		@close="toRemove = null"
	/>
</template>
