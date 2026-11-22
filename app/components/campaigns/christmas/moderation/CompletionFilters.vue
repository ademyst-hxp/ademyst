<script setup lang="ts">
import Box from "~/components/base/Box.vue";

/*
 * Filtres de GET /moderation/completions :
 *   day     quête 1-25 (null = toutes)
 *   profile ID de profil (pas le @nom), 10 caractères maximum côté API
 *   from/to YYYY-MM-DD (jour UTC entier) ou chaîne vide
 */
type CompletionFilters = {
	day: number | null;
	profile: string;
	from: string;
	to: string;
};

const model = defineModel<CompletionFilters>({
	default: () => ({ day: null, profile: "", from: "", to: "" }),
});

const DAYS = Array.from({ length: 25 }, (_, index) => index + 1);

const update = (patch: Partial<CompletionFilters>) => {
	model.value = { ...model.value, ...patch };
};

const hasFilters = computed(
	() =>
		model.value.day !== null ||
		model.value.profile !== "" ||
		model.value.from !== "" ||
		model.value.to !== "",
);

const reset = () => update({ day: null, profile: "", from: "", to: "" });

const fieldClass =
	"bg-input text-input-text border border-surface-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-input-focus-ring";
</script>
<template>
	<Box scale="sm">
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<label class="flex flex-col gap-1 text-sm font-semibold">
				Quête
				<select
					:class="fieldClass"
					:value="model.day ?? ''"
					@change="
						update({
							day:
								($event.target as HTMLSelectElement).value === ''
									? null
									: Number(($event.target as HTMLSelectElement).value),
						})
					"
				>
					<option value="">Toutes</option>
					<option v-for="day in DAYS" :key="day" :value="day">
						Jour {{ day }}
					</option>
				</select>
			</label>

			<!-- `change` (blur ou Entrée) plutôt qu'`input` : pas une requête par frappe. -->
			<label class="flex flex-col gap-1 text-sm font-semibold">
				ID du profil
				<input
					type="text"
					maxlength="10"
					autocomplete="off"
					:class="fieldClass"
					:value="model.profile"
					@change="
						update({
							profile: ($event.target as HTMLInputElement).value.trim(),
						})
					"
				/>
			</label>

			<label class="flex flex-col gap-1 text-sm font-semibold">
				Depuis le
				<input
					type="date"
					:class="fieldClass"
					:value="model.from"
					:max="model.to || undefined"
					@change="
						update({ from: ($event.target as HTMLInputElement).value })
					"
				/>
			</label>

			<label class="flex flex-col gap-1 text-sm font-semibold">
				Jusqu'au
				<input
					type="date"
					:class="fieldClass"
					:value="model.to"
					:min="model.from || undefined"
					@change="
						update({ to: ($event.target as HTMLInputElement).value })
					"
				/>
			</label>
		</div>

		<div class="flex items-center justify-between gap-2">
			<p class="text-xs text-surface-text/70">
				Les dates sont des jours UTC entiers.
			</p>
			<Button
				v-if="hasFilters"
				label="Réinitialiser"
				variant="white"
				size="small"
				:handler="reset"
			/>
		</div>
	</Box>
</template>
