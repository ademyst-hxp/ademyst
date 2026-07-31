import type {
	Notification as DbNotification,
	Alert as DbAlert,
} from "~~/server/db/schema/inbox";
import type { Notification, Alert } from "~~/shared/models/inbox";
import type { Profile } from "~~/shared/models/profiles";
import type { Post, Whisper } from "~~/shared/models/interactions";

export function convertNotification(
	notification: DbNotification,
	options: {
		issuer?: Profile | null;
		post?: Post | null;
		whisper?: Whisper | null;
	} = {},
): Notification {
	return {
		id: notification.id,
		issuer: options.issuer ?? null,
		post: options.post ?? null,
		whisper: options.whisper ?? null,
		type: notification.type,
		read: String(notification.read) === "true",
		createdAt: notification.createdAt,
	};
}

export function convertAlert(alert: DbAlert): Alert {
	return {
		id: alert.id,
		type: alert.type,
		read: String(alert.read) === "true",
		createdAt: alert.createdAt,
	};
}
