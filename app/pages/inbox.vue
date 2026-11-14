<script setup lang="ts">
import { ArrowPathIcon } from "@heroicons/vue/24/outline";

import type { Account } from "~~/shared/models/accounts";
import type {
	Notification,
	NotificationCategory,
	NotificationFilter,
} from "~~/shared/models/inbox";

import WarningBox from "~/components/boxes/Warning.vue";
import NotificationBox from "~/components/notifications/Notification.vue";

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

type InboxPage = {
	notifications: Notification[];
	next: number;
	hasNext: boolean;
};

type InboxTab = NotificationFilter | "account-security";
const tab = ref<InboxTab>("all");
const PAGE_SIZE = 20;

const fetchPage = async (offset: number): Promise<InboxPage> => {
	const types =
		tab.value === "account-security"
			? (["account", "moderation", "security"] as const)
			: ([tab.value] as const);

	if (types.length === 1) {
		return $api<InboxPage>("/inbox", {
			query: { limit: PAGE_SIZE, offset, type: types[0] },
		});
	}

	const pages = await Promise.all(
		types.map((type) =>
			$api<InboxPage>("/inbox", {
				query: { limit: offset + PAGE_SIZE + 1, offset: 0, type },
			}),
		),
	);
	const merged = pages
		.flatMap((page) => page.notifications)
		.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		);
	const page = merged.slice(offset, offset + PAGE_SIZE);
	return {
		notifications: page,
		next: offset + page.length,
		hasNext: merged.length > offset + PAGE_SIZE,
	};
};

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

const tabs: { name: string; value: InboxTab }[] = [
	{ name: "Toutes", value: "all" },
	{ name: "Interactions", value: "interactions" },
	{ name: "Relations", value: "relations" },
	{ name: "Récompenses", value: "rewards" },
	{ name: "Compte et sécurité", value: "account-security" },
	{ name: "Annonces", value: "announcements" },
];

type AccountResponse = { status: "ok"; data: Account };
const { data: account } = await useAsyncData(
	"settings-account",
	async () => (await $api<AccountResponse>("/account")).data,
);

const openNotification = (notification: Notification) => {
	switch (notification.type) {
		case "content.post":
			return navigateTo(`/posts/${notification.post.id}`);
		case "content.whisper":
			return navigateTo(`/discover?whisper=${notification.whisper.id}`);
		case "interaction.reply":
			return navigateTo(`/posts/${notification.reply.id}`);
		case "interaction.reaction":
		case "interaction.milestone":
			return notification.subject.kind === "post"
				? navigateTo(`/posts/${notification.subject.post.id}`)
				: navigateTo(`/discover?whisper=${notification.subject.whisper.id}`);
		case "relation.follower":
		case "relation.request":
			return navigateTo(`/@${notification.actor.name}`);
		case "announcement.alert":
		case "announcement.news":
			if (notification.announcement.actionUrl) {
				return navigateTo(notification.announcement.actionUrl);
			}
			break;
	}
};

onMounted(() => {
	if (!fetchError.value) {
		$api("/inbox/read", { method: "POST" }).catch((reason) => {
			console.error("Impossible de marquer les notifications comme lues.", reason);
		});
	}
});
</script>

<template>
	<Teleport to="#header">
		<h1 class="text-2xl font-bold font-title text-center">Notifications</h1>
		<Button
			label="Actualiser"
			:handler="refreshNotifications"
			variant="link"
			class="mx-auto"
		/>
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

	<p
		v-if="error"
		class="py-8 text-center text-sm text-danger"
	>
		{{ error }}
	</p>
	<section v-else class="flex flex-col gap-2">
		<NotificationBox
			v-for="notification in notifications"
			:key="notification.id"
			:data="notification"
			@open="openNotification"
		/>
		<p
			v-if="!notifications.length && !hasNext && !refreshing"
			class="py-8 text-center text-sm text-surface-text-muted"
		>
			Aucune notification en vue pour le moment.
		</p>
	</section>

	<div ref="sentinel" class="flex justify-center py-6 text-muted">
		<ArrowPathIcon
			v-if="loadingMore || refreshing"
			class="h-6 w-6 animate-spin"
		/>
	</div>
</template>
