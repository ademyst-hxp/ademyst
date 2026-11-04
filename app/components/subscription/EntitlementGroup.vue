<script setup lang="ts">
import type {
	BadgeEntitlement,
	LevelEntitlement,
} from "~~/shared/models/entitlements";
import type { EntitlementForm } from "~/composables/useEntitlements";

import { PlusIcon } from "@heroicons/vue/24/outline";

import Box from "../base/Box.vue";

type Entitlement = LevelEntitlement | BadgeEntitlement;

const props = withDefaults(
	defineProps<{
		title: string;
		badge?: BadgeEntitlement["badge"];
		description?: string;
		items: Entitlement[];
		// Whether the viewer may change this group at all.
		manageable?: boolean;
		// Per-item permission, on top of `manageable`.
		canAct?: (item: Entitlement) => boolean;
		// Shows the level/badge name on each card (mixed groups).
		showItemTitle?: boolean;
		assignLabel?: string;
		// Replaces the assign form by a link (levels handled elsewhere).
		assignHref?: string;
		// Warning displayed instead of the actions (e.g. unknown badge).
		warning?: string;
		assign?: (form: EntitlementForm) => Promise<unknown>;
		toggle: (item: Entitlement, enabled: boolean) => Promise<unknown>;
		revoke: (item: Entitlement) => Promise<unknown>;
	}>(),
	{
		manageable: true,
		showItemTitle: false,
		assignLabel: "Accorder",
	},
);

const error = ref<string | null>(null);

const run = async (action: () => Promise<unknown>) => {
	error.value = null;

	try {
		await action();
	} catch (err) {
		const data = (err as { data?: { statusMessage?: string } })?.data;

		error.value =
			data?.statusMessage ??
			(err instanceof Error ? err.message : String(err));
	}
};

const current = computed(() =>
	props.items.filter((item) =>
		["active", "disabled"].includes(getEntitlementStatus(item)),
	),
);

const history = computed(() =>
	props.items.filter(
		(item) => !["active", "disabled"].includes(getEntitlementStatus(item)),
	),
);

const showHistory = ref(false);

const allowed = (item: Entitlement) =>
	props.manageable && (props.canAct ? props.canAct(item) : true);

const itemTitle = (item: Entitlement) =>
	"level" in item ? item.level.name : item.badge.name;

const isActive = computed(() =>
	props.items.some((item) => getEntitlementStatus(item) === "active"),
);

/* Assign form */
const formOpen = ref(false);
const form = reactive<{ name: string; reason: string; expiresAt: string }>({
	name: "",
	reason: "",
	expiresAt: "",
});

const submit = () =>
	run(async () => {
		await props.assign?.({ ...form });

		form.name = "";
		form.reason = "";
		form.expiresAt = "";
		formOpen.value = false;
	});

const toRevoke = ref<Entitlement | null>(null);

const confirmRevoke = () => {
	const item = toRevoke.value;

	if (item) run(() => props.revoke(item));
};
</script>
<template>
	<Box>
		<div class="flex items-start gap-2">
			<div class="grow flex items-center gap-1">
				<span class="text-xl font-bold">
					{{ badge?.name || title }}
				</span>
				<img
					v-if="badge"
					:src="`/api/v1/badges/${badge.id}/icon.png`"
					alt=""
					class="shrink-0 w-6 h-6"
				/>
			</div>
			<span
				class="text-sm font-semibold"
				:class="isActive ? 'text-success' : 'text-muted'"
			>
				{{ isActive ? "Actif" : "Inactif" }}
			</span>
		</div>

		<p v-if="description" class="text-muted">{{ description }}</p>
		<p v-if="warning" class="text-warning">{{ warning }}</p>

		<form
			v-if="formOpen && assign"
			class="flex flex-col gap-3"
			@submit.prevent="() => {}"
		>
			<Input
				v-model="form.name"
				label="Intitulé (facultatif)"
				placeholder="Moderator Assignment"
			/>
			<Input
				v-model="form.reason"
				type="textarea"
				label="Raison (facultatif)"
				placeholder="Pourquoi cet accès est accordé"
			/>
			<Input
				v-model="form.expiresAt"
				type="datetime-local"
				label="Date d'expiration (vide : permanent)"
			/>
			<Button label="Enregistrer" :handler="submit" />
		</form>

		<p v-if="error" class="text-danger">{{ error }}</p>

		<p v-if="current.length === 0" class="text-muted">
			Aucun accès en cours.
		</p>

		<div class="flex flex-col gap-2 -mx-4">
			<template
				v-for="item in showHistory ? [...current, ...history] : current"
				:key="item.id"
			>
				<Box scale="sm" class="border-surface-border">
					<div class="flex items-center gap-2">
						<h4 class="grow font-semibold">
							<template v-if="showItemTitle">
								{{ itemTitle(item) }} ·
							</template>
							{{ item.name }}
						</h4>
						<span
							class="text-sm font-semibold"
							:class="
								ENTITLEMENT_STATUS_LABELS[
									getEntitlementStatus(item)
								].class
							"
						>
							{{
								ENTITLEMENT_STATUS_LABELS[
									getEntitlementStatus(item)
								].label
							}}
						</span>
					</div>
					<p v-if="item.reason" class="text-muted text-sm">
						{{ item.reason }}
					</p>
					<p class="text-muted text-sm">
						Accordé le {{ formatEntitlementDate(item.createdAt) }} ·
						{{
							item.expiresAt
								? `expire le ${formatEntitlementDate(item.expiresAt)}`
								: "permanent"
						}}
					</p>
					<div
						v-if="allowed(item) && !item.revoked"
						class="flex items-center gap-2 mt-1"
					>
						<Button
							v-if="getEntitlementStatus(item) !== 'expired'"
							:label="item.enabled ? 'Désactiver' : 'Activer'"
							:variant="item.enabled ? 'secondary' : 'success'"
							size="small"
							:handler="
								() => run(() => toggle(item, !item.enabled))
							"
						/>
						<Button
							label="Révoquer"
							variant="danger"
							size="small"
							:handler="() => (toRevoke = item)"
						/>
					</div>
				</Box>
			</template>
		</div>

		<Button
			v-if="history.length > 0"
			:label="
				showHistory
					? `Masquer l'historique`
					: `Afficher l'historique (${history.length})`
			"
			variant="link"
			size="small"
			:handler="() => (showHistory = !showHistory)"
		/>

		<template v-if="manageable && !warning">
			<Button
				v-if="assignHref"
				:label="assignLabel"
				size="small"
				:handler="assignHref"
			/>
			<Button
				v-else-if="assign"
				:label="assignLabel"
				size="small"
				:variant="formOpen ? 'secondary' : 'primary'"
				:handler="() => (formOpen = !formOpen)"
			/>
		</template>

		<Dialog
			v-if="toRevoke"
			title="Révoquer cet accès ?"
			description="La révocation est définitive : il faudra en accorder un nouveau pour le rétablir."
			:actions="[
				{ label: 'Annuler', variant: 'secondary', handler: () => {} },
				{
					label: 'Révoquer',
					variant: 'danger',
					handler: confirmRevoke,
				},
			]"
			@close="toRevoke = null"
		/>
	</Box>
</template>
