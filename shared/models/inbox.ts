import type { Post, Status } from "./interactions";
import type { Profile } from "./profiles";

export type NotificationType =
	| "follow"
	| "follow_request_accepted"
	| "new_post"
	| "mention"
	| "reply"
	| "reaction"
	| "status_update"
	| "status_mention"
	| "status_reaction";

export type Notification = {
	id: string;
	issuer: Profile | null;
	post: Post | null;
	status: Status | null;
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
