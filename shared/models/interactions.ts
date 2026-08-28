import type { Attachment } from "./drive";
import type { Profile } from "./profiles";

export type PostVisibility =
	| "outside"
	| "everyone"
	| "followers"
	| "friends"
	| "me";

export type PostReactionType = "like";
export type PostFlagType =
	| "NFE"
	| "AI"
	| "joke"
	| "misinformation"
	| "spam"
	| "suspicious"
	| "suicide";

export type WhisperVisibility =
	| "outside"
	| "everyone"
	| "followers"
	| "friends"
	| "me";

export type Post = {
	id: string;
	profile: Profile;
	parentId: string | null;
	content: string;
	visibility: PostVisibility;
	createdAt: Date;
	updatedAt: Date | null;
	attachments: Attachment[];
	flags: PostFlag[];
	interaction: {
		liked: boolean;
		reported: boolean;
		saved: false;
	};
	stats: {
		reactions: Record<PostReactionType, number>;
		answers: number;
	};
};

export type PostReaction = {
	id: string;
	postId: string;
	profileId: string;
	reaction: PostReactionType;
	createdAt: Date;
};

export type PostFlag = {
	id: string;
	postId: string;
	flag: PostFlagType;
	createdAt: Date;
};

export type Whisper = {
	id: string;
	profile: Profile;
	content: string;
	image: Attachment | null;
	color: string | null;
	textColor: string | null;
	visibility: WhisperVisibility;
	createdAt: Date;
};

export type WhisperReaction = {
	id: string;
	whisperId: string;
	profileId: string;
	reaction: string;
	createdAt: Date;
};
