<script setup lang="ts">
import Box from "~/components/base/Box.vue";
import ProfileRow from "~/components/profile/ProfileRow.vue";

import {
	UsersIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "@heroicons/vue/24/outline";

import Info from "~/components/boxes/Info.vue";

import type { Referral, ReferralCode } from "~~/shared/models/referrals";

const { session, refresh: refreshSession } = useAuthSession();
await refreshSession();

const { $api } = useNuxtApp();

if (!session.value) {
	navigateTo("/auth/login");
}

const {
	data: myReferrer,
	error: myReferrerError,
	pending: myReferrerPending,
	refresh: refreshMyReferrer,
} = useAsyncData("myReferrer", async () => {
	return (
		(
			await $api<{ data: Referral | null }>("/referrals/mine", {
				method: "GET",
			})
		)?.data ?? null
	);
});

const {
	data: myReferralCodes,
	error: myReferralCodesError,
	pending: myReferralCodesPending,
	refresh: refreshMyReferralCodes,
} = useAsyncData("myReferralCodes", async () => {
	const res = (
		await $api<{ data: ReferralCode[] }>("/referrals/codes", {
			method: "GET",
		})
	)?.data;

	return res ?? [];
});

/** Claim un parrainage **/

const referralCodeInput = ref("");

const submitReferralCode = async () => {
	if (!referralCodeInput.value) return;

	try {
		await $api(`/referrals/codes/${referralCodeInput.value}/claim`, {
			method: "POST",
		});

		await refreshMyReferrer();
	} catch (error) {
		console.error(error);
	}
};

/** Générer un code de parrainage **/

const generateReferralCode = async () => {
	try {
		await $api("/referrals/codes/new", {
			method: "POST",
		});

		await refreshMyReferralCodes();
	} catch (error) {
		console.error(error);
	}
};

/** Focus le code de parrainage **/

const referralCodeIndex = ref<number>(0);
const focusedReferralCode = computed(() => {
	if (!myReferralCodes.value || myReferralCodes.value.length === 0) {
		return null;
	}

	return myReferralCodes.value[
		referralCodeIndex.value % myReferralCodes.value.length
	];
});

const copyReferralCode = (referralCode: ReferralCode) => {
	navigator.clipboard.writeText(referralCode.code);
};

const disableReferralCode = async (referralCode: ReferralCode) => {
	try {
		await $api(`/referrals/codes/${referralCode.code}/disable`, {
			method: "POST",
		});

		await refreshMyReferralCodes();
	} catch (error) {
		console.error(error);
	}
};

definePageMeta({
	title: "Faire parler d'Ademyst | Ademyst",
	description: "Modifiez vos paramètres de compte et d'affichage.",
	middleware: ["auth"],
});

useHead({
	title: "Faire parler d'Ademyst | Ademyst",
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
		<nav
			class="grid grid-cols-[auto_1fr_auto] items-center justify-center gap-4"
		>
			<Button
				label="Retour"
				variant="link"
				:icon="ChevronLeftIcon"
				:handler="() => navigateTo('/settings')"
				class="justify-self-start"
			/>
			<h1 class="justify-self-center text-2xl font-bold font-title">
				Faire parler d'Ademyst
			</h1>
		</nav>
	</Teleport>

	<section class="flex flex-col gap-4">
		<h2 class="text-xl font-semibold font-title">Mon parrain</h2>
		<Box v-if="myReferrerPending">
			<p class="text-surface-text-muted">Chargement...</p>
		</Box>
		<Box v-else-if="myReferrerError">
			<p class="text-danger">Une erreur est survenue.</p>
			<Button
				label="Réessayer"
				variant="primary"
				:handler="refreshMyReferrer"
			/>
		</Box>
		<Box v-else-if="myReferrer">
			<ProfileRow :data="myReferrer.referralCode.author" />
			<p>
				<strong>Code:</strong>
				<code
					class="bg-widget text-widget-text font-mono border border-widget-border rounded-lg px-1 py-0.5 ml-1"
					tabindex="0"
					@click="copyReferralCode(myReferrer.referralCode)"
				>
					{{ myReferrer.referralCode.code }}
				</code>
			</p>
		</Box>
		<Box v-else class="flex flex-col gap-2">
			<Input
				label="Code de parrainage"
				placeholder="Entrez le code de votre parrain"
				v-model="referralCodeInput"
			/>
			<Button
				label="Soumettre"
				variant="primary"
				:handler="submitReferralCode"
			/>
		</Box>
	</section>

	<section class="flex flex-col gap-4">
		<h2 class="text-xl font-semibold font-title">Parrainer des amis</h2>
		<Info :icon="UsersIcon" title="Mon ami(e) est déjà inscrit(e) ?">
			Copie le code uniquement ci-dessous et envoie-le à ton ami(e) pour
			qu'il/elle puisse l'utiliser sur cette même page, à la place de la
			section "Mon parrain". Vous pourrez ensuite bénéficier des avantages
			liés au parrainage.
		</Info>
		<Box v-if="myReferralCodesPending" class="items-center justify-center">
			<p class="text-surface-text-muted">Chargement...</p>
			<Button
				label="Générer un code"
				variant="primary"
				:handler="generateReferralCode"
			/>
		</Box>
		<Box
			v-else-if="myReferralCodesError"
			class="items-center justify-center"
		>
			<p class="text-danger">Une erreur est survenue.</p>
			<div class="flex items-center gap-0.5">
				<Button
					label="Réessayer"
					variant="primary"
					:handler="refreshMyReferralCodes"
				/>
				<Button
					label="Générer un code"
					variant="white"
					:handler="generateReferralCode"
				/>
			</div>
		</Box>
		<Box
			v-else-if="(myReferralCodes?.length ?? 0) > 0"
			class="items-center justify-center"
		>
			<p>
				{{ (referralCodeIndex % (myReferralCodes?.length ?? 1)) + 1 }}/{{ myReferralCodes?.length ?? 1 }}
			</p>
			<div class="flex items-center gap-0.5">
				<ChevronLeftIcon
					class="h-6 w-6 cursor-pointer text-surface-text-muted hover:text-surface-text"
					@click="referralCodeIndex--"
					tabindex="0"
				/>
				<div
					v-for="letter in focusedReferralCode?.code.toUpperCase() || []"
					class="bg-black/5 text-xl font-semibold font-title rounded-lg px-2"
				>
					{{ letter }}
				</div>
				<ChevronRightIcon
					class="h-6 w-6 cursor-pointer text-surface-text-muted hover:text-surface-text"
					@click="referralCodeIndex++"
					tabindex="0"
				/>
			</div>
			<div class="flex items-center gap-2" v-if="focusedReferralCode">
				<Button
					label="Copier le code"
					variant="white"
					:handler="
						() =>
							copyReferralCode(
								focusedReferralCode as ReferralCode,
							)
					"
				/>
				<Button
					label="Désactiver le code"
					variant="white"
					:handler="
						() =>
							disableReferralCode(
								focusedReferralCode as ReferralCode,
							)
					"
				/>
			</div>
			<Button
				label="Générer un code"
				variant="primary"
				:handler="generateReferralCode"
			/>
		</Box>
		<Box v-else class="items-center justify-center">
			<p class="text-surface-text-muted">
				Aucun parrainage pour le moment. Partage ton code pour inviter
				tes amis !
			</p>
		</Box>
	</section>
</template>
