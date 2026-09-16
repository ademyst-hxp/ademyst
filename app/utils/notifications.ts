import type {
	AccountSanctionNotification,
	PostSanctionNotification,
	ReportNotification,
	FollowNotification,
	PostNotification,
	WhisperNotification,
} from "~~/shared/models/inbox";

import {
	HeartIcon,
	AtSymbolIcon,
	ChatBubbleLeftRightIcon,
	ClockIcon,
	UserPlusIcon,
	ScaleIcon,
} from "@heroicons/vue/24/outline";
import type { Post, Whisper } from "~~/shared/models/interactions";
import type { Profile } from "~~/shared/models/profiles";
import type { Sanction } from "~~/shared/models/sanctions";
import type {
	ProfileReport,
	PostReport,
	WhisperReport,
} from "~~/shared/models/reports";

type Notification =
	| AccountSanctionNotification
	| PostSanctionNotification
	| ReportNotification
	| FollowNotification
	| PostNotification
	| WhisperNotification;

export const getNotificationType = (
	notification: Notification,
):
	| "post"
	| "whisper"
	| "follow"
	| "account_sanction"
	| "post_sanction"
	| "report"
	| "unknown" => {
	if ("sanction" in notification && "profile" in notification) {
		return "account_sanction";
	} else if ("sanction" in notification && "post" in notification) {
		return "post_sanction";
	} else if ("post" in notification) {
		return "post";
	} else if ("whisper" in notification) {
		return "whisper";
	} else if ("relationship" in notification) {
		return "follow";
	} else if (
		"postReport" in notification ||
		"whisperReport" in notification ||
		"profileReport" in notification
	) {
		return "report";
	} else {
		return "unknown";
	}
};

export const makeNotificationGroups = (
	notifications: Notification[],
): Notification[][] => {
	const groups: Notification[][] = [];

	notifications.forEach((notification) => {
		const type = getNotificationType(notification);

		if (
			groups.length === 0 ||
			groups[groups.length - 1]?.length == 0 ||
			getNotificationType(groups[groups.length - 1]![0]!) !== type
		) {
			groups.push([notification]);
		} else {
			groups[groups.length - 1]?.push(notification);
		}
	});

	return groups;
};

export const getNotificationAction: any = (
	notification: Notification,
	handlers: {
		onPostClick: (post: Post) => void;
		onWhisperClick: (whisper: Whisper) => void;
		onProfileClick: (profile: Profile) => void;
		onSanctionClick: (sanction: Sanction) => void;
		onReportClick: (
			report: ProfileReport | PostReport | WhisperReport,
		) => void;
	},
): {
	label: string;
	icon: Component;
	indicator?: string;
	handler: () => void;
} | null => {
	let label = "";
	let icon = null;
	let handler = () => {};

	switch (getNotificationType(notification)) {
		case "post":
			let postNotif = notification as PostNotification;

			switch (postNotif.type) {
				case "mention":
					label = `${postNotif.issuer.displayName || `@${postNotif.issuer.name}` || '@ghost'} vous a mentionné dans une publication.`;
					icon = AtSymbolIcon;
					handler = () => handlers.onPostClick(postNotif.post);
					break;
				case "reply":
					label = `${postNotif.issuer.displayName || `@${postNotif.issuer.name}` || "@ghost"} a répondu à votre publication.`;
					icon = ChatBubbleLeftRightIcon;
					handler = () => handlers.onPostClick(postNotif.post);
					break;
				case "reaction":
					label = `${postNotif.issuer.displayName || `@${postNotif.issuer.name}` || "@ghost"} a aimé votre publication.`;
					icon = HeartIcon;
					handler = () => handlers.onPostClick(postNotif.post);
					break;
				case "suggestion":
				default:
					label = `Cette publication de ${postNotif.issuer.displayName || `@${postNotif.issuer.name}` || "@ghost"} pourrait vous plaire.`;
					icon = HeartIcon;
					handler = () => handlers.onPostClick(postNotif.post);
					break;
			}
			break;
		case "whisper":
			let whisperNotif = notification as WhisperNotification;

			switch (whisperNotif.type) {
				case "mention":
					label = `${whisperNotif.issuer.displayName || `@${whisperNotif.issuer.name}` || "@ghost"} vous a mentionné dans une pensée.`;
					icon = AtSymbolIcon;
					handler = () =>
						handlers.onWhisperClick(whisperNotif.whisper);
					break;
				case "reaction":
					label = `${whisperNotif.issuer.displayName || `@${whisperNotif.issuer.name}` || "@ghost"} a aimé votre pensée.`;
					icon = HeartIcon;
					handler = () =>
						handlers.onWhisperClick(whisperNotif.whisper);
					break;
				case "suggestion":
				default:
					label = `Cette pensée de ${whisperNotif.issuer.displayName || `@${whisperNotif.issuer.name}` || "@ghost"} pourrait vous plaire.`;
					icon = HeartIcon;
					handler = () =>
						handlers.onWhisperClick(whisperNotif.whisper);
					break;
			}
			break;
		case "follow":
			let profileNotif = notification as FollowNotification;

			switch (profileNotif.type) {
				case "request":
					label = `${profileNotif.issuer.displayName || `@${profileNotif.issuer.name}` || "@ghost"} a demandé à vous suivre.`;
					icon = ClockIcon;
					handler = () =>
						handlers.onProfileClick(profileNotif.issuer);
					break;
				case "request_accepted":
					label = `${profileNotif.issuer.displayName || `@${profileNotif.issuer.name}` || "@ghost"} a accepté votre demande de suivi.`;
					icon = UserPlusIcon;
					handler = () =>
						handlers.onProfileClick(profileNotif.issuer);
					break;
				case "happened":
				default:
					label = `${profileNotif.issuer.displayName || `@${profileNotif.issuer.name}` || "@ghost"} a commencé à vous suivre.`;
					icon = UserPlusIcon;
					handler = () =>
						handlers.onProfileClick(profileNotif.issuer);
					break;
			}
			break;
		case "post_sanction":
			let postSanctionNotif = notification as PostSanctionNotification;

			switch (postSanctionNotif.type) {
				case "removal":
					label = `Votre publication a été supprimée pour non-respect des règles.`;
					icon = ScaleIcon;
					handler = () =>
						handlers.onSanctionClick(postSanctionNotif.sanction);
					break;
				case "flag":
				default:
					label = `Votre publication a été signalée pour non-respect des règles.`;
					icon = ScaleIcon;
					handler = () =>
						handlers.onSanctionClick(postSanctionNotif.sanction);
					break;
			}
			break;
		case "account_sanction":
			let accountSanctionNotif =
				notification as AccountSanctionNotification;

			switch (accountSanctionNotif.type) {
				case "account_suspension":
					label = `Votre compte a été suspendu.`;
					icon = ScaleIcon;
					handler = () =>
						handlers.onSanctionClick(accountSanctionNotif.sanction);
					break;
				case "shadow_ban":
					label = `La visibilité de votre profil a été restreinte.`;
					icon = ScaleIcon;
					handler = () =>
						handlers.onSanctionClick(accountSanctionNotif.sanction);
					break;
				case "mute":
					label = `Votre compte a été mis en sourdine.`;
					icon = ScaleIcon;
					handler = () =>
						handlers.onSanctionClick(accountSanctionNotif.sanction);
					break;
				case "warn":
				default:
					label = `Votre avez reçu un avertissement de la modération.`;
					icon = ScaleIcon;
					handler = () =>
						handlers.onSanctionClick(accountSanctionNotif.sanction);
					break;
			}
			break;
		case "report":
			let reportNotif = notification as ReportNotification;

			switch (reportNotif.type) {
				case "update":
					label = `Une mise à jour a été effectuée sur votre signalement.`;
					icon = ScaleIcon;
					handler = () =>
						handlers.onReportClick(
							reportNotif.profileReport ||
								reportNotif.postReport ||
								reportNotif.whisperReport!,
						);
					break;
				case "read":
				default:
					label = `Votre signalement a bien été reçu.`;
					icon = ScaleIcon;
					handler = () =>
						handlers.onReportClick(
							reportNotif.profileReport ||
								reportNotif.postReport ||
								reportNotif.whisperReport!,
						);
					break;
			}
			break;
		default:
			return null;
	}

	return {
		label,
		icon,
		indicator: notification.read ? undefined : "Non lu",
		handler,
	};
};
