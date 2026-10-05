<script setup lang="ts">
import Actions from "~/components/base/Actions.vue";

import type {
	AccountSanctionNotification,
	PostSanctionNotification,
	ReportNotification,
	PostNotification,
	WhisperNotification,
	FollowNotification,
} from "~~/shared/models/inbox";

import type { Profile } from "~~/shared/models/profiles";
import type { Sanction } from "~~/shared/models/sanctions";
import type {
	ProfileReport,
	PostReport,
	WhisperReport,
} from "~~/shared/models/reports";

import type { Post, Whisper } from "~~/shared/models/interactions";

import NotificationBox from "~/components/notifications/Notification.vue";

import {
	getNotificationType,
	makeNotificationGroups,
	getNotificationAction,
} from "~/utils/notifications";

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

const {
	data: notifications,
	error: fetchError,
	refresh: refreshNotifications,
} = useAsyncData("inbox", () =>
	$api<{
		notifications: (
			| AccountSanctionNotification
			| PostSanctionNotification
			| ReportNotification
			| PostNotification
			| WhisperNotification
			| FollowNotification
		)[];
	}>("/inbox").then((res) => res.notifications),
);

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

const tab = ref<"all" | "interactions" | "relations" | "sanctions" | "reports">(
	"all",
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

	<section v-if="tab === 'all'" class="flex flex-col gap-2">
		<Actions v-for="group in groupedActions" scale="sm" :actions="group" />

		<p
			v-if="!notifications?.length"
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
				).length
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
				).length
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
				).length
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
				).length
			"
			class="text-sm text-surface-text-muted text-center py-8"
		>
			Aucune notification en vue pour le moment.
		</p>
	</section>
</template>
