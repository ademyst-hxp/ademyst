import type { Post, Whisper } from "./interactions";
import type { Profile } from "./profiles";

export type NotificationType =
	| "follow"
	| "follow_request_accepted"
	| "new_post"
	| "mention"
	| "reply"
	| "reaction"
	| "whisper_update"
	| "whisper_mention"
	| "whisper_reaction";

export type Notification = {
	id: string;
	issuer: Profile | null;
	post: Post | null;
	whisper: Whisper | null;
	type: NotificationType;
	read: boolean;
	createdAt: Date;
};

export type AlertType =
	| "account_suspension"
	| "shadow_ban"
	| "content_removal"
	| "report_resolution"
	| "sanction"
	| "other";

export type Alert = {
	id: string;
	type: AlertType;
	read: boolean;
	createdAt: Date;
};
