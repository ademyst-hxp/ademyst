<script setup lang="ts">
import { ArrowPathIcon, Cog6ToothIcon } from "@heroicons/vue/24/outline";

import type { Account } from "~~/shared/models/accounts";
import type {
	InboxPage,
	Notification,
	NotificationFilter,
} from "~~/shared/models/inbox";

import WarningBox from "~/components/boxes/Warning.vue";
import EmptyData from "~/components/layout/EmptyData.vue";
import NotificationBox from "~/components/notifications/Notification.vue";
import {
	getNotificationLink,
	groupNotificationsByDay,
	NOTIFICATION_FILTERS,
} from "~/utils/notifications";

const { $api } = useNuxtApp();
const { session, refresh } = useAuthSession();
await refresh();

if (!session.value) {
	navigateTo("/auth/login");
}

definePageMeta({
	title: "Notifications | Ademyst",
	description:
		"Restez informé des dernières activités et interactions sur Ademyst grâce à votre boîte de réception de notifications.",
	middleware: ["auth"],
});

useHead({ title: "Notifications | Ademyst" });

const tab = ref<NotificationFilter>("all");
const PAGE_SIZE = 20;

const fetchPage = (offset: number): Promise<InboxPage> =>
	$api<InboxPage>("/inbox", {
		query: { limit: PAGE_SIZE, offset, type: tab.value },
	});

const {
	data: firstPage,
	error: fetchError,
	refresh: refreshFirstPage,
} = await useAsyncData("inbox", () => fetchPage(0));

const notifications = ref<Notification[]>(
	firstPage.value?.notifications ?? [],
);
const nextOffset = ref(firstPage.value?.next ?? 0);
const hasNext = ref(firstPage.value?.hasNext ?? false);
const loadingMore = ref(false);
const refreshing = ref(false);
let generation = 0;

const seedFromFirstPage = () => {
	notifications.value = firstPage.value?.notifications ?? [];
	nextOffset.value = firstPage.value?.next ?? 0;
	hasNext.value = firstPage.value?.hasNext ?? false;
};

const refreshNotifications = async () => {
	generation++;
	refreshing.value = true;
	try {
		await refreshFirstPage();
		seedFromFirstPage();
	} finally {
		refreshing.value = false;
	}
};

watch(tab, refreshNotifications);

const loadMoreNotifications = async (): Promise<boolean> => {
	if (loadingMore.value || refreshing.value || !hasNext.value) return false;

	const requestGeneration = generation;
	loadingMore.value = true;
	try {
		const page = await fetchPage(nextOffset.value);
		if (requestGeneration !== generation) return false;

		const known = new Set(notifications.value.map((item) => item.id));
		notifications.value.push(
			...page.notifications.filter((item) => !known.has(item.id)),
		);
		nextOffset.value = page.next;
		hasNext.value = page.hasNext;
		return true;
	} finally {
		loadingMore.value = false;
	}
};

const { sentinel, recheck } = useScrollSentinel(
	loadMoreNotifications,
	() => hasNext.value,
);

watch(refreshing, (value) => {
	if (!value) recheck();
});

const error = computed(() =>
	fetchError.value ? "Impossible de récupérer les notifications." : null,
);

const tabs = NOTIFICATION_FILTERS;

type AccountResponse = { status: "ok"; data: Account };
const { data: account } = await useAsyncData(
	"settings-account",
	async () => (await $api<AccountResponse>("/account")).data,
);

const openNotification = (notification: Notification) => {
	const link = getNotificationLink(notification);
	if (link) return navigateTo(link);
};

const groups = computed(() => groupNotificationsByDay(notifications.value));

// La page marque tout comme lu dès son ouverture : on retient ce qui était
// nouveau pour garder le repère visuel jusqu'à la fermeture de la page.
const unreadIds = ref(new Set<string>());
const rememberUnread = (items: Notification[]) => {
	for (const item of items) {
		if (!item.read) unreadIds.value.add(item.id);
	}
};
rememberUnread(notifications.value);
watch(notifications, (items) => rememberUnread(items), { deep: true });

const emptyMessage = computed(() =>
	tab.value === "all"
		? "Vous n'avez aucune notification pour le moment."
		: "Aucune notification dans cette catégorie.",
);

onMounted(() => {
	if (!fetchError.value) {
		$api("/inbox/read", { method: "POST" })
			.then(() => refreshNuxtData("notifications-count"))
			.catch((reason) => {
				console.error(
					"Impossible de marquer les notifications comme lues.",
					reason,
				);
			});
	}
});
</script>

<template>
	<Teleport to="#header">
		<h1 class="text-2xl font-bold font-title text-center">Notifications</h1>
		<div class="flex items-center justify-center gap-4">
			<Button
				label="Actualiser"
				:handler="refreshNotifications"
				variant="link"
			/>
			<Button
				label="Réglages"
				:icon="Cog6ToothIcon"
				:handler="() => navigateTo('/settings/notifications')"
				variant="link"
			/>
		</div>
		<TabBar v-model="tab" :tabs />
	</Teleport>

	<WarningBox
		v-if="account?.email && !account.confirmedAt"
		title="Adresse e-mail non confirmée"
	>
		<p>
			Votre adresse e-mail n'est pas confirmée. Veuillez vérifier votre
			boîte de réception pour le lien de confirmation.
		</p>
		<RouterLink
			to="/settings/account"
			class="font-semibold hover:underline"
		>
			Paramètres de compte
		</RouterLink>
	</WarningBox>

	<p v-if="error" class="py-8 text-center text-sm text-danger">
		{{ error }}
	</p>
	<template v-else>
		<section
			v-for="group in groups"
			:key="group.label"
			class="flex flex-col gap-2"
		>
			<h2
				class="px-4 text-sm font-semibold uppercase tracking-wide text-muted"
			>
				{{ group.label }}
			</h2>
			<NotificationBox
				v-for="notification in group.notifications"
				:key="notification.id"
				:data="notification"
				:unread="unreadIds.has(notification.id)"
				@open="openNotification"
			/>
		</section>

		<EmptyData
			v-if="!notifications.length && !hasNext && !refreshing"
			title="Rien à signaler"
			:message="emptyMessage"
			class="py-8"
		/>
	</template>

	<div ref="sentinel" class="flex justify-center py-6 text-muted">
		<ArrowPathIcon
			v-if="loadingMore || refreshing"
			class="h-6 w-6 animate-spin"
		/>
	</div>
</template>
