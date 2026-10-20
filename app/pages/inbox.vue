<script setup lang="ts">
import {
	getNotificationAction,
	getNotificationType,
	makeNotificationGroups,
} from "~/utils/notifications";

import type { Account } from "~~/shared/models/accounts";
import type { AccountSanctionNotification } from "~~/shared/models/inbox";
import type { FollowNotification } from "~~/shared/models/inbox";
import type { PostNotification } from "~~/shared/models/inbox";
import type { PostSanctionNotification } from "~~/shared/models/inbox";
import type { ReportNotification } from "~~/shared/models/inbox";
import type { WhisperNotification } from "~~/shared/models/inbox";
import type { Post } from "~~/shared/models/interactions";
import type { Whisper } from "~~/shared/models/interactions";
import type { Profile } from "~~/shared/models/profiles";
import type { PostReport } from "~~/shared/models/reports";
import type { ProfileReport } from "~~/shared/models/reports";
import type { WhisperReport } from "~~/shared/models/reports";
import type { Sanction } from "~~/shared/models/sanctions";

import { ArrowPathIcon } from "@heroicons/vue/24/outline";

import Actions from "~/components/base/Actions.vue";
import WarningBox from "~/components/boxes/Warning.vue";
import NotificationBox from "~/components/notifications/Notification.vue";

const { $api } = useNuxtApp();
const { session, refresh } = useAuthSession();
await refresh();

const error = ref<string | null>(null);

if (!session.value) {
	navigateTo("/auth/login");
}

definePageMeta({
	title: "Notifications | Ademyst",
	description:
		"Restez informé des dernières activités et interactions sur Ademyst grâce à votre boîte de réception de notifications.",
	middleware: ["auth"],
});

useHead({
	title: "Notifications | Ademyst",
	meta: [
		{
			name: "description",
			content:
				"Restez informé des dernières activités et interactions sur Ademyst grâce à votre boîte de réception de notifications.",
		},
		{
			name: "keywords",
			content: "Beam, Ademyst, Discover",
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

const tab = ref<"all" | "interactions" | "relations" | "sanctions" | "reports">(
	"all",
);

type InboxNotification =
	| AccountSanctionNotification
	| PostSanctionNotification
	| ReportNotification
	| PostNotification
	| WhisperNotification
	| FollowNotification;

type InboxPage = {
	notifications: InboxNotification[];
	next: number;
	hasNext: boolean;
};

const PAGE_SIZE = 20;

const fetchPage = (offset: number) =>
	$api<InboxPage>("/inbox", {
		// The tab is the server-side filter: the API only returns (and
		// paginates) the notifications of the selected type.
		query: { limit: PAGE_SIZE, offset, type: tab.value },
	});

const {
	data: firstPage,
	error: fetchError,
	refresh: refreshFirstPage,
} = await useAsyncData("inbox", () => fetchPage(0));

// Notifications loaded so far (first page + the following ones).
const notifications = ref<InboxNotification[]>([]);
const nextOffset = ref(0);
const hasNext = ref(false);
const loadingMore = ref(false);

// Incremented on every refresh so that a page requested before it cannot be
// appended afterwards.
let generation = 0;

const seedFromFirstPage = () => {
	notifications.value = firstPage.value?.notifications ?? [];
	nextOffset.value = firstPage.value?.next ?? 0;
	hasNext.value = firstPage.value?.hasNext ?? false;
};

seedFromFirstPage();

const refreshing = ref(false);

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

// Another tab = another filter: start again from its first page.
watch(tab, () => {
	notifications.value = [];
	hasNext.value = true;
	refreshNotifications();
});

const notificationKey = (notification: InboxNotification) =>
	`${getNotificationType(notification)}-${notification.id}`;

const loadMoreNotifications = async (): Promise<boolean> => {
	if (loadingMore.value || refreshing.value || !hasNext.value) return false;

	const startedAt = generation;
	loadingMore.value = true;

	try {
		const page = await fetchPage(nextOffset.value);

		if (startedAt !== generation) return false;

		// New notifications arriving meanwhile shift the offsets: never show
		// the same notification twice.
		const known = new Set(notifications.value.map(notificationKey));

		notifications.value = [
			...notifications.value,
			...page.notifications.filter((n) => !known.has(notificationKey(n))),
		];
		nextOffset.value = page.next;
		hasNext.value = page.hasNext;

		return true;
	} catch (err) {
		console.error("Erreur lors du chargement des notifications:", err);

		return false;
	} finally {
		loadingMore.value = false;
	}
};

const { sentinel, recheck } = useScrollSentinel(
	loadMoreNotifications,
	() => hasNext.value,
);

// A page requested during a refresh is skipped: check again when it is over.
watch(refreshing, (value) => {
	if (!value) recheck();
});

const criticalCount = computed(() => {
	if (!notifications.value) return 0;

	const accountSanctionNotifications = notifications.value.filter(
		(n: any): n is AccountSanctionNotification =>
			n.type === "account_sanction",
	);

	const postSanctionNotifications = notifications.value.filter(
		(n: any): n is PostSanctionNotification => n.type === "post_sanction",
	);

	return (
		accountSanctionNotifications.length + postSanctionNotifications.length
	);
});

const totalCount = computed(() => {
	if (!notifications.value) return 0;

	return notifications.value.length;
});

onMounted(() => {
	if (fetchError.value) {
		error.value = "Impossible de récupérer les notifications.";
	} else {
		$api("/inbox/read", {
			method: "POST",
		}).catch((err) => {
			console.error(
				"Erreur lors de la mise à jour des notifications comme lues:",
				err,
			);
		});
	}
});

const tabs = [
	{
		name: "Toutes",
		value: "all",
	},
	{
		name: "Interactions",
		value: "interactions",
	},
	{
		name: "Relations",
		value: "relations",
	},
	{
		name: "Sanctions",
		value: "sanctions",
	},
	{
		name: "Signalements",
		value: "reports",
	},
];

/************************************/

type AccountResponse = {
	status: "ok";
	data: Account;
};

const { data: account, refresh: refreshAccount } = await useAsyncData(
	"settings-account",
	async () => {
		return (await $api<AccountResponse>(`/account`)).data;
	},
);

/************************************/

type Action = {
	label: string;
	icon: Component;
	handler: () => void;
};

const groupedNotifications = computed(() => {
	if (!notifications.value) return [];

	return makeNotificationGroups(notifications.value);
});

const groupedActions = computed(() => {
	if (!notifications.value) return [];

	return groupedNotifications.value.map((group) => {
		const actions: Action[] = [];

		group.forEach((notification: any) => {
			const action = getNotificationAction(notification, {
				onPostClick: (post: Post) => {
					navigateTo(`/post/${post.id}`);
				},
				onWhisperClick: (whisper: Whisper) => {
					navigateTo(`/discover?whisper=${whisper.id}`);
				},
				onProfileClick: (profile: Profile) => {
					navigateTo(`/@${profile.name}`);
				},
				onSanctionClick: (sanction: Sanction) => {
					tab.value = "sanctions";
				},
				onReportClick: (
					report: ProfileReport | PostReport | WhisperReport,
				) => {
					tab.value = "reports";
				},
			});

			if (action) {
				actions.push(action);
			}
		});

		return actions;
	});
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
		v-if="account?.email && !account?.confirmedAt"
		title="Adresse e-mail non confirmée"
	>
		<p>
			Votre adresse e-mail n'est pas confirmée. Veuillez vérifier votre
			boîte de réception pour le lien de confirmation.
		</p>
		<RouterLink
			:to="`/settings/account`"
			class="font-semibold hover:underline"
		>
			Paramètres de compte
		</RouterLink>
	</WarningBox>

	<section v-if="tab === 'all'" class="flex flex-col gap-2">
		<Actions v-for="group in groupedActions" scale="sm" :actions="group" />

		<p
			v-if="!notifications?.length && !hasNext && !refreshing"
			class="text-sm text-surface-text-muted text-center py-8"
		>
			Aucune notification en vue pour le moment.
		</p>
	</section>

	<section v-if="tab === 'interactions'" class="flex flex-col gap-2">
		<NotificationBox
			v-for="notification in notifications?.filter((n) =>
				['post', 'whisper'].includes(getNotificationType(n)),
			)"
			:key="notification.id"
			:data="notification"
		/>
		<p
			v-if="
				!notifications?.filter((n) =>
					['post', 'whisper'].includes(getNotificationType(n)),
				).length &&
				!hasNext &&
				!refreshing
			"
			class="text-sm text-surface-text-muted text-center py-8"
		>
			Aucune notification en vue pour le moment.
		</p>
	</section>

	<section v-if="tab === 'relations'" class="flex flex-col gap-2">
		<NotificationBox
			v-for="notification in notifications?.filter((n) =>
				['follow'].includes(getNotificationType(n)),
			)"
			:key="notification.id"
			:data="notification"
		/>
		<p
			v-if="
				!notifications?.filter((n) =>
					['follow'].includes(getNotificationType(n)),
				).length &&
				!hasNext &&
				!refreshing
			"
			class="text-sm text-surface-text-muted text-center py-8"
		>
			Aucune notification en vue pour le moment.
		</p>
	</section>

	<section v-if="tab === 'sanctions'" class="flex flex-col gap-2">
		<NotificationBox
			v-for="notification in notifications?.filter((n) =>
				['account_sanction', 'post_sanction'].includes(
					getNotificationType(n),
				),
			)"
			:key="notification.id"
			:data="notification"
		/>
		<p
			v-if="
				!notifications?.filter((n) =>
					['account_sanction', 'post_sanction'].includes(
						getNotificationType(n),
					),
				).length &&
				!hasNext &&
				!refreshing
			"
			class="text-sm text-surface-text-muted text-center py-8"
		>
			Aucune notification en vue pour le moment.
		</p>
	</section>

	<section v-if="tab === 'reports'" class="flex flex-col gap-2">
		<NotificationBox
			v-for="notification in notifications?.filter((n) =>
				['report'].includes(getNotificationType(n)),
			)"
			:key="notification.id"
			:data="notification"
		/>
		<p
			v-if="
				!notifications?.filter((n) =>
					['report'].includes(getNotificationType(n)),
				).length &&
				!hasNext &&
				!refreshing
			"
			class="text-sm text-surface-text-muted text-center py-8"
		>
			Aucune notification en vue pour le moment.
		</p>
	</section>

	<!-- Pagination sentinel -->
	<div ref="sentinel" class="flex justify-center py-6 text-muted">
		<ArrowPathIcon
			v-if="loadingMore || refreshing"
			class="w-6 h-6 animate-spin"
		/>
	</div>
</template>
