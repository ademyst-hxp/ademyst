<script setup lang="ts">
// Panneau de filtres de la recherche de publications.
// Assemblé uniquement à partir des composants existants (Box, Input,
// InlineSelect, Button) : aucun contrôle natif restylé à la main.
import { ArrowUturnLeftIcon } from "@heroicons/vue/24/outline";

import {
	SEARCH_COUNT_MAX,
	SEARCH_REPLIES,
} from "~~/shared/consts/search";

import type { SearchForm } from "~/utils/search";
import type { PostSearchReplies } from "~~/shared/models/search";

import Box from "~/components/base/Box.vue";
import Button from "~/components/Button.vue";
import InlineSelect from "~/components/InlineSelect.vue";
import Input from "~/components/Input.vue";

const model = defineModel<SearchForm>({ required: true });

const emit = defineEmits<{
	(e: "reset"): void;
}>();

const set = <K extends keyof SearchForm>(key: K, value: SearchForm[K]) => {
	model.value = { ...model.value, [key]: value };
};

// Une recherche doit porter sur au moins un champ.
const setScope = (key: "content" | "author" | "tags", value: boolean) => {
	const next = { ...model.value, [key]: value };

	if (!next.content && !next.author && !next.tags) return;

	model.value = next;
};

const setReplies = (value: string) =>
	set("replies", value as PostSearchReplies);

const asCount = (value: unknown): number | null =>
	typeof value === "number" && !Number.isNaN(value) ? value : null;

const REPLIES_LABELS: Record<PostSearchReplies, string> = {
	include: "Tout",
	exclude: "Publications",
	only: "Réponses",
};

const repliesOptions = SEARCH_REPLIES.map((value) => ({
	value,
	label: REPLIES_LABELS[value],
}));

const COUNTS = [
	{
		title: "Liens",
		min: "minLinks",
		max: "maxLinks",
	},
	{
		title: "Images",
		min: "minImages",
		max: "maxImages",
	},
] as const;
</script>
<template>
	<Box scale="sm">
		<div class="flex flex-col gap-5">
			<!-- Champs -->
			<section class="flex flex-col gap-2">
				<h3 class="px-4 text-sm font-semibold text-muted">Chercher dans</h3>
				<div class="flex flex-wrap gap-x-6 gap-y-2 px-4">
					<Input
						type="checkbox"
						label="Contenu"
						:model-value="model.content"
						@update:model-value="setScope('content', Boolean($event))"
					/>
					<Input
						type="checkbox"
						label="Auteur (pseudo ou nom)"
						:model-value="model.author"
						@update:model-value="setScope('author', Boolean($event))"
					/>
					<Input
						type="checkbox"
						label="Tags"
						:model-value="model.tags"
						@update:model-value="setScope('tags', Boolean($event))"
					/>
				</div>
			</section>

			<!-- Dates -->
			<section class="flex flex-col gap-2">
				<h3 class="px-4 text-sm font-semibold text-muted">
					Date de publication
				</h3>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<Input
						type="date"
						label="Après le"
						:model-value="model.after"
						@update:model-value="set('after', String($event ?? ''))"
					/>
					<Input
						type="date"
						label="Avant le"
						:model-value="model.before"
						@update:model-value="set('before', String($event ?? ''))"
					/>
				</div>
			</section>

			<!-- Pièces jointes -->
			<section class="flex flex-col gap-2">
				<h3 class="px-4 text-sm font-semibold text-muted">
					Pièces jointes
				</h3>
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<template v-for="count in COUNTS" :key="count.title">
						<Input
							type="number"
							:label="`${count.title} (min.)`"
							placeholder="0"
							:min="0"
							:max="SEARCH_COUNT_MAX"
							:model-value="model[count.min]"
							@update:model-value="set(count.min, asCount($event))"
						/>
						<Input
							type="number"
							:label="`${count.title} (max.)`"
							placeholder="∞"
							:min="0"
							:max="SEARCH_COUNT_MAX"
							:model-value="model[count.max]"
							@update:model-value="set(count.max, asCount($event))"
						/>
					</template>
				</div>
			</section>

			<!-- Popularité -->
			<section class="flex flex-col gap-2">
				<h3 class="px-4 text-sm font-semibold text-muted">Popularité</h3>
				<div class="grid grid-cols-2 gap-3">
					<Input
						type="number"
						label="J'aime (min.)"
						placeholder="0"
						:min="0"
						:max="SEARCH_COUNT_MAX"
						:model-value="model.minLikes"
						@update:model-value="set('minLikes', asCount($event))"
					/>
					<Input
						type="number"
						label="Réponses (min.)"
						placeholder="0"
						:min="0"
						:max="SEARCH_COUNT_MAX"
						:model-value="model.minAnswers"
						@update:model-value="set('minAnswers', asCount($event))"
					/>
				</div>
			</section>

			<!-- Type -->
			<section class="flex flex-col gap-2">
				<h3 class="px-4 text-sm font-semibold text-muted">Afficher</h3>
				<InlineSelect
					:model-value="model.replies"
					:options="repliesOptions"
					scale="small"
					@update:model-value="setReplies"
				/>
			</section>

			<!-- Auteur -->
			<section class="flex flex-col gap-2">
				<h3 class="px-4 text-sm font-semibold text-muted">Auteur</h3>
				<Input
					label="Publié par (pseudo exact)"
					placeholder="@pseudo"
					:max-length="17"
					:model-value="model.from"
					@update:model-value="set('from', String($event ?? ''))"
				/>
				<div class="px-4">
					<Input
						type="checkbox"
						label="Uniquement les comptes que je suis"
						:model-value="model.following"
						@update:model-value="set('following', Boolean($event))"
					/>
				</div>
			</section>

			<!-- Contenus signalés -->
			<section class="flex flex-col gap-2">
				<h3 class="px-4 text-sm font-semibold text-muted">
					Contenus signalés
				</h3>
				<div class="flex flex-col gap-2 px-4">
					<Input
						type="checkbox"
						label="Masquer les contenus sensibles ou douteux (NFE, spam, désinformation…)"
						:model-value="model.hideSensitive"
						@update:model-value="set('hideSensitive', Boolean($event))"
					/>
					<Input
						type="checkbox"
						label="Masquer les contenus générés par IA"
						:model-value="model.hideAI"
						@update:model-value="set('hideAI', Boolean($event))"
					/>
				</div>
			</section>

			<div class="flex justify-end">
				<Button
					label="Réinitialiser les filtres"
					:icon="ArrowUturnLeftIcon"
					variant="secondary"
					size="small"
					:handler="() => emit('reset')"
				/>
			</div>
		</div>
	</Box>
</template>
