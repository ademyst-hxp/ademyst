<script setup lang="ts">
import {
	BellAlertIcon,
	ChatBubbleLeftRightIcon,
	CheckBadgeIcon,
	ClockIcon,
	EnvelopeIcon,
	HeartIcon,
	InformationCircleIcon,
	LockClosedIcon,
	ScaleIcon,
	UserPlusIcon,
} from "@heroicons/vue/24/outline";

import type { Notification } from "#shared/models/inbox";
import { NOTIFICATION_TYPE_META } from "~~/shared/consts/notifications";
import Box from "~/components/base/Box.vue";
import PostCard from "~/components/cards/PostCard.vue";
import WhisperCard from "~/components/interactions/Whisper.vue";
import Avatar from "~/components/profile/Avatar.vue";
import { convertToLitteralDuration } from "~/utils/date";

const props = defineProps<{
	data: Notification;
}>();

const emit = defineEmits<{
	(e: "open", notification: Notification): void;
}>();

const actorName = (actor: { displayName: string | null; name: string }) =>
	actor.displayName || `@${actor.name}`;

const actor = computed(() => {
	const notification = props.data;
	return "actor" in notification ? notification.actor : null;
});

const severity = computed(
	() => NOTIFICATION_TYPE_META[props.data.type].severity,
);
const important = computed(
	() =>
		severity.value === "danger" ||
		severity.value === "warning" ||
		props.data.category === "security",
);

const hasPreview = computed(
	() =>
		props.data.type === "content.post" ||
		props.data.type === "content.whisper" ||
		props.data.type === "interaction.reply" ||
		props.data.type === "interaction.reaction" ||
		props.data.type === "interaction.milestone" ||
		props.data.type === "level.granted" ||
		props.data.type === "level.expired" ||
		props.data.type === "level.revoked" ||
		props.data.type === "announcement.alert" ||
		props.data.type === "announcement.news",
);

const label = computed(() => {
	const notification = props.data;

	switch (notification.type) {
		case "content.post":
			return `${actorName(notification.actor)} a publié une nouvelle publication.`;
		case "content.whisper":
			return `${actorName(notification.actor)} a publié une nouvelle pensée.`;
		case "interaction.reaction":
			return `${actorName(notification.actor)} a réagi à votre contenu.`;
		case "interaction.milestone":
			return `Votre contenu a atteint ${notification.data.threshold} réactions.`;
		case "interaction.reply":
			return `${actorName(notification.actor)} a répondu à votre publication.`;
		case "relation.follower":
			return `${actorName(notification.actor)} a commencé à vous suivre.`;
		case "relation.request":
			return `${actorName(notification.actor)} a demandé à vous suivre.`;
		case "report.received":
			return "Votre signalement a bien été reçu.";
		case "report.rejected":
			return "Votre signalement a été rejeté.";
		case "report.actioned":
			return "Une action a été prise à la suite de votre signalement.";
		case "report.downgraded":
			return "Le niveau de votre signalement a été réduit.";
		case "sanction.issued":
			return "Une sanction a été appliquée à votre compte.";
		case "sanction.updated":
			return "Votre sanction a été mise à jour.";
		case "sanction.lifted":
			return "Votre sanction a été levée.";
		case "sanction.expired":
			return "Votre sanction a expiré.";
		case "badge.granted":
			return "Vous avez obtenu un badge.";
		case "badge.expired":
			return "Un badge est arrivé à expiration.";
		case "badge.revoked":
			return "Un badge vous a été retiré.";
		case "level.granted":
			return "Vous avez atteint un nouveau niveau.";
		case "level.expired":
			return "Votre niveau a changé.";
		case "level.revoked":
			return "Votre niveau a été révoqué.";
		case "security.email_changed":
			return "Votre adresse e-mail a été modifiée.";
		case "security.email_confirmed":
			return "Votre adresse e-mail a été confirmée.";
		case "security.password_changed":
			return "Votre mot de passe a été modifié.";
		case "security.deletion_requested":
			return "Une demande de suppression de compte a été enregistrée.";
		case "account.settings_changed":
			return "Les paramètres de votre compte ont été modifiés.";
		case "announcement.alert":
			return notification.announcement.title;
		case "announcement.news":
			return notification.announcement.title;
	}
});

const icon = computed(() => {
	switch (props.data.type) {
		case "content.post":
		case "content.whisper":
			return InformationCircleIcon;
		case "interaction.reaction":
			return HeartIcon;
		case "interaction.milestone":
			return CheckBadgeIcon;
		case "interaction.reply":
			return ChatBubbleLeftRightIcon;
		case "relation.follower":
			return UserPlusIcon;
		case "relation.request":
			return ClockIcon;
		case "report.received":
		case "report.rejected":
		case "report.actioned":
		case "report.downgraded":
		case "sanction.issued":
		case "sanction.updated":
		case "sanction.lifted":
		case "sanction.expired":
			return ScaleIcon;
		case "badge.granted":
		case "badge.expired":
		case "badge.revoked":
		case "level.granted":
		case "level.expired":
		case "level.revoked":
			return CheckBadgeIcon;
		case "security.email_changed":
		case "security.email_confirmed":
			return EnvelopeIcon;
		case "security.password_changed":
		case "security.deletion_requested":
			return LockClosedIcon;
		case "account.settings_changed":
			return BellAlertIcon;
		case "announcement.alert":
		case "announcement.news":
			return BellAlertIcon;
	}
});

const createdLabel = computed(() =>
	convertToLitteralDuration(new Date(props.data.createdAt), new Date()),
);
</script>
<template>
	<Box
		scale="md"
		:layout="hasPreview ? 'vertical' : 'horizontal'"
		class="group cursor-pointer gap-3 transition-colors hover:bg-surface-hover"
		:class="{ 'border-primary': !data.read }"
		@click="emit('open', data)"
	>
		<div class="flex min-w-0 items-center gap-3 w-full">
			<NuxtLink
				v-if="actor"
				:to="`/@${actor.name}`"
				class="shrink-0"
				@click.stop
			>
				<Avatar
					:src="`/api/v1/users/${actor.name}/avatar.webp`"
					size="md"
				/>
			</NuxtLink>
			<div
				v-else
				class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-hover"
			>
				<component :is="icon" class="h-8 w-8" />
			</div>
			<div class="min-w-0 grow">
				<p class="truncate font-medium">{{ label }}</p>
			</div>
			<div class="flex shrink-0 items-center gap-2 text-right">
				<p class="text-sm text-surface-text-muted">
					{{ createdLabel }}
				</p>
				<span
					v-if="important"
					class="h-2.5 w-2.5 rounded-full bg-danger"
					title="Important"
					aria-label="Important"
				/>
				<span
					v-if="!data.read"
					class="h-2.5 w-2.5 rounded-full bg-primary"
					aria-label="Non lue"
				/>
			</div>
		</div>
		<div class="min-w-0 -m-2">
			<PostCard
				v-if="data.type === 'content.post'"
				:data="data.post"
				scale="sm"
				class="w-full"
			/>
			<WhisperCard
				v-else-if="data.type === 'content.whisper'"
				:data="data.whisper"
				minified
				class="w-full"
			/>
			<PostCard
				v-else-if="data.type === 'interaction.reply'"
				:data="data.reply"
				scale="sm"
				class="w-full"
			/>
			<PostCard
				v-else-if="
					(data.type === 'interaction.reaction' ||
						data.type === 'interaction.milestone') &&
					data.subject.kind === 'post'
				"
				:data="data.subject.post"
				scale="sm"
				class="w-full"
			/>
			<WhisperCard
				v-else-if="
					(data.type === 'interaction.reaction' ||
						data.type === 'interaction.milestone') &&
					data.subject.kind === 'whisper'
				"
				:data="data.subject.whisper"
				minified
				class="w-full"
			/>
			<Box
				v-else-if="
					data.type === 'announcement.alert' ||
					data.type === 'announcement.news'
				"
				scale="sm"
				class="border-primary/20 bg-surface-hover"
			>
				<p class="text-sm font-semibold">
					{{ data.announcement.title }}
				</p>
				<p class="mt-1 line-clamp-3 text-sm text-surface-text-muted">
					{{ data.announcement.body }}
				</p>
			</Box>
			<Box
				v-else-if="
					data.type === 'level.granted' ||
					data.type === 'level.expired' ||
					data.type === 'level.revoked'
				"
				scale="sm"
				class="flex items-center gap-3 border-primary/20 bg-surface-hover"
			>
				<img
					v-if="data.badge"
					:src="`/api/v1/badges/${data.badge.id}/icon.png`"
					:alt="data.badge.name"
					class="h-10 w-10 shrink-0"
				/>
				<div class="min-w-0">
					<p class="font-semibold">{{ data.level?.name ?? "Niveau" }}</p>
					<p
						v-if="data.badge"
						class="text-sm text-surface-text-muted"
					>
						{{ data.badge.name }}
					</p>
				</div>
			</Box>
		</div>
	</Box>
</template>
