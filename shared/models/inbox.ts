import type { Post, Whisper } from "./interactions";
import type { Profile } from "./profiles";
import type { Sanction } from "./sanctions";

// 5 types de notifications : interactions, relations, sanctions, signalements, autres
export type InteractionNotificationType =
	"suggestion" | "mention" | "reply" | "reaction" | "sanction";

export type RelationNotificationType =
	"request" | "request_accepted" | "happened";

export type SanctionNotificationType =
	"account_suspension" | "shadow_ban" | "mute" | "warn";

export type PostSanctionNotificationType = "removal" | "flag";

export type ReportNotificationType = "update" | "read";

// Notifications liées à des interactions (posts, whispers, etc.)
export type PostNotification = {
	id: string;

	post: Post;
	issuer: Profile;

	type: InteractionNotificationType;
	read: boolean;

	createdAt: Date;
	updatedAt: Date;
};

export type WhisperNotification = {
	id: string;

	whisper: Whisper;
	issuer: Profile;

	type: InteractionNotificationType;
	read: boolean;

	createdAt: Date;
	updatedAt: Date;
};

// Notifications liées à des relations (follow, request, etc.)
export type FollowNotification = {
	id: string;

	profile: Profile;
	issuer: Profile;

	type: RelationNotificationType;
	read: boolean;

	createdAt: Date;
	updatedAt: Date;
};

// Notifications liées à des sanctions (account suspension, shadow ban, content removal/flag, etc.)
export type AccountSanctionNotification = {
	id: string;

	profile: Profile;
	sanction: Sanction;

	type: SanctionNotificationType;
	read: boolean;

	createdAt: Date;
	updatedAt: Date;
};

export type PostSanctionNotification = {
	id: string;

	post: Post;
	issuer?: Profile;

	type: PostSanctionNotificationType;
	read: boolean;

	createdAt: Date;
	updatedAt: Date;
};

// Notifications liées à des signalements (report)
export type ReportNotification = {
	id: string;

	reportedProfile?: Profile;
	reportedPost?: Post;
	reportedWhisper?: Whisper;

	type: ReportNotificationType;
	read: boolean;

	createdAt: Date;
	updatedAt: Date;
};
