<script setup lang="ts">
import {
	ArrowDownTrayIcon,
	DocumentArrowDownIcon,
} from "@heroicons/vue/24/outline";

import Info from "~/components/boxes/Info.vue";
import Button from "~/components/Button.vue";

import type { DataExport, DataExportStatus } from "~~/shared/models/exports";

type ListResponse = {
	status: "ok";
	data: DataExport[];
	nextAvailableAt: string | null;
};

const { $api } = useNuxtApp();

const { data, refresh } = await useAsyncData("account-exports", () =>
	$api<ListResponse>("/account/exports"),
);

// Avant le montage, les dates sont rendues de façon déterministe (UTC) pour éviter
// un écart d'hydratation entre le fuseau du serveur et celui du navigateur.
const mounted = ref(false);

onMounted(async () => {
	mounted.value = true;

	await refresh();
});

const error = ref<string | null>(null);

const exports = computed(() => data.value?.data ?? []);

const nextAvailableAt = computed(() =>
	data.value?.nextAvailableAt ? new Date(data.value.nextAvailableAt) : null,
);

const canRequest = computed(
	() => !nextAvailableAt.value || nextAvailableAt.value.getTime() <= Date.now(),
);

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
	dateStyle: "long",
	timeStyle: "short",
});

const formatDate = (value: string | Date) =>
	mounted.value
		? dateFormatter.format(new Date(value))
		: new Date(value).toISOString().split("T")[0];

const STATUS_LABELS: Record<DataExportStatus, string> = {
	processing: "En préparation",
	ready: "Prêt",
	failed: "Échec",
};

const STATUS_CLASSES: Record<DataExportStatus, string> = {
	processing: "text-warning",
	ready: "text-success",
	failed: "text-danger",
};

type ApiError = {
	response?: { status?: number };
};

const requestExport = async () => {
	error.value = null;

	try {
		await $api("/account/exports/new", { method: "POST" });
	} catch (e) {
		const status = (e as ApiError).response?.status;

		error.value =
			status === 429
				? "Vous avez déjà demandé un export cette semaine."
				: "Impossible de générer l'export. Réessayez plus tard.";
	}

	await refresh();
};

const downloadExport = async (item: DataExport) => {
	error.value = null;

	try {
		// Passage par $api (et non un simple lien) pour envoyer le jeton d'authentification
		const file = await $api<Blob>(`/account/exports/${item.id}/download`, {
			responseType: "blob",
		});

		const url = URL.createObjectURL(file);
		const link = document.createElement("a");

		link.href = url;
		link.download = `ademyst-export-${new Date(item.createdAt).toISOString().split("T")[0]}.json`;

		document.body.appendChild(link);
		link.click();
		link.remove();

		setTimeout(() => URL.revokeObjectURL(url), 10_000);
	} catch (e) {
		const status = (e as ApiError).response?.status;

		error.value =
			status === 410
				? "Ce fichier n'est plus disponible. Demandez un nouvel export."
				: "Impossible de télécharger l'export. Réessayez plus tard.";

		await refresh();
	}
};
</script>
<template>
	<section id="export-data" class="flex flex-col gap-4 scroll-mt-24">
		<h2 class="text-xl font-semibold font-title">Exporter mes données</h2>
		<p class="text-muted">
			Récupérez une copie de vos données personnelles (compte, profil,
			publications, relations, réglages, historique de sécurité...) dans
			un fichier JSON.
		</p>
		<Info title="Quelques précisions">
			Vous pouvez demander un export par semaine. Chaque fichier reste
			téléchargeable pendant 7 jours. Il contient des informations
			personnelles : ne le partagez pas. Les images (avatar, fonds) ne
			sont pas incluses.
		</Info>

		<p v-if="error" class="text-danger" role="alert">{{ error }}</p>

		<div class="flex flex-wrap items-center gap-3">
			<Button
				label="Demander un export"
				variant="primary"
				:icon="DocumentArrowDownIcon"
				:disabled="!canRequest"
				:handler="requestExport"
			/>
			<p v-if="!canRequest && nextAvailableAt" class="text-muted text-sm">
				Prochain export possible le {{ formatDate(nextAvailableAt) }}.
			</p>
		</div>

		<p v-if="exports.length === 0" class="text-muted">
			Aucun export disponible.
		</p>
		<ul v-else class="flex flex-col gap-2">
			<li
				v-for="item in exports"
				:key="item.id"
				class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface border border-surface-border p-4"
			>
				<div class="flex flex-col">
					<strong>Export du {{ formatDate(item.createdAt) }}</strong>
					<span class="text-sm text-muted">
						<span :class="STATUS_CLASSES[item.status]">{{
							STATUS_LABELS[item.status]
						}}</span>
						<template v-if="item.size !== null">
							· {{ formatBytes(item.size) }}
						</template>
						<template v-if="item.status === 'ready'">
							· Disponible jusqu'au {{ formatDate(item.expiresAt) }}
						</template>
					</span>
				</div>
				<Button
					v-if="item.status === 'ready'"
					label="Télécharger"
					variant="secondary"
					size="small"
					:icon="ArrowDownTrayIcon"
					:handler="() => downloadExport(item)"
				/>
			</li>
		</ul>
	</section>
</template>
