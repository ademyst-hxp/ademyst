<script setup lang="ts">
import {
	HandThumbUpIcon,
	TrashIcon,
	ScaleIcon,
	ShieldCheckIcon,
	ArrowPathIcon,
} from "@heroicons/vue/24/outline";

import type { ProfileReport } from "~~/shared/models/reports";

import Box from "../base/Box.vue";

const props = withDefaults(
	defineProps<{
		data: ProfileReport;
		editable?: boolean;
		handlable?: boolean;
	}>(),
	{
		editable: false,
		handlable: false,
	},
);

const data = reactive(props.data);

const reviewReport = async (status: "reviewed" | "rejected" | "pending") => {
	if (!props.handlable) return;

	const { $api } = useNuxtApp();

	await $api(`/moderation/reports/${props.data.id}/review`, {
		method: "POST",
		body: JSON.stringify({ status }),
	});

	data.status = status;
};
</script>
<template>
	<Box :key="'report-' + data.id" class="shrink-0">
		<div class="flex flex-col justify-center -space-y-1">
			<Input
				v-if="editable"
				v-model="data.reason"
				placeholder="Raison du signalement"
				class="w-full -mx-2"
			/>
			<template v-else>
				<h3 class="text-xl font-bold">{{ data.reason }}</h3>
				<span class="text-muted text-sm">
					{{
						new Date(data.createdAt).toLocaleString("fr-FR", {
							day: "2-digit",
							month: "long",
							year: "numeric",
							hour: "2-digit",
							minute: "2-digit",
						})
					}}
				</span>
			</template>
		</div>
		<div class="flex items-center gap-2">
			<template v-if="editable">
				<div class="bg-muted w-2 h-2 rounded-full">
					<div
						class="bg-muted w-2 h-2 rounded-full opacity-50 animate-ping"
					></div>
				</div>
				<span class="text-muted text-sm font-semibold"
					>En attente d'informations</span
				>
			</template>
			<template v-else-if="data.status === 'pending'">
				<div class="bg-warning w-2 h-2 rounded-full">
					<div
						class="bg-warning w-2 h-2 rounded-full opacity-50 animate-ping"
					></div>
				</div>
				<span class="text-warning text-sm font-semibold"
					>En attente</span
				>
			</template>
			<template v-else-if="data.status === 'reviewed'">
				<div class="bg-success w-2 h-2 rounded-full"></div>
				<span class="text-success text-sm font-semibold">Résolu</span>
			</template>
			<template v-else-if="data.status === 'rejected'">
				<div class="bg-danger w-2 h-2 rounded-full"></div>
				<span class="text-danger text-sm font-semibold">Rejeté</span>
			</template>
		</div>
		<Input
			v-if="editable"
			v-model="data.details"
			type="textarea"
			placeholder="Détails du signalement"
			class="w-full -mx-2"
		/>
		<div
			v-else
			class="bg-widget text-widget-text break-after-all wrap-break-word border-l-4 border-l-widget-border max-h-144 px-3 py-3 overflow-x-visible overflow-y-auto"
		>
			<p>{{ data.details }}</p>
		</div>
		<div class="flex flex-col justify-center" v-if="!editable">
			<p v-if="data.id" class="text-muted text-sm">
				Signalement n°<code>{{ data.id }}</code>
			</p>
			<p v-if="data.reporter" class="text-muted text-sm">
				Effectué par <b>{{ data.reporter.email }}</b>
			</p>
			<p v-if="data.reportedProfile" class="text-muted text-sm">
				Concernant <b>@{{ data.reportedProfile.name }}</b>
			</p>
		</div>
		<div v-if="handlable" class="flex items-center gap-2">
			<template v-if="data.status === 'pending'">
				<Button
					label="Marquer comme résolu"
					:icon="ShieldCheckIcon"
					variant="success"
					size="small"
					:handler="() => reviewReport('reviewed')"
				/>
				<Button
					label="Rejeter le signalement"
					:icon="TrashIcon"
					variant="danger"
					size="small"
					:handler="() => reviewReport('rejected')"
				/>
			</template>
			<template v-else>
				<Button
					label="Déclasser"
					:icon="ArrowPathIcon"
					variant="warning"
					size="small"
					:handler="() => reviewReport('pending')"
				/>
			</template>
			<Button
				label="Effectuer une action"
				:icon="ScaleIcon"
				variant="secondary"
				size="small"
				:handler="() => reviewReport('reviewed')"
			/>
		</div>
		<div v-if="editable" class="flex flex-col gap-4">
			<h3 class="flex items-center gap-2 text-lg font-semibold">
				<HandThumbUpIcon class="w-6 h-6" /> Bonnes pratiques
			</h3>
			<ul class="list-disc list-inside">
				<li>
					Signalez tout ce qui vous semble <b>inapproprié</b> ou
					<b>contraire aux règles de la communauté</b>.
				</li>
				<li>Soyez le plus <b>clair</b> et <b>précis</b> possible.</li>
				<li>
					Ne signalez pas <b>plusieurs fois</b> la même chose tant que
					vous n'avez pas obtenu de réponse.
				</li>
				<li>
					Si vous pensez que la suite d'un signalement est injuste ou
					insuffisante, vous pouvez
					<b>demander une réévaluation</b> en précisant que vous avez
					déjà signalé le contenu.
				</li>
			</ul>
		</div>
		<div v-if="editable" class="flex items-center gap-2">
			<slot name="edit-actions">
				<span class="text-muted text-sm"
					>Vous êtes en train de modifier ce signalement.</span
				>
			</slot>
		</div>
	</Box>
</template>
