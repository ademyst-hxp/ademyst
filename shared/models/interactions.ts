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
	| "NFE" // Not Family Friendly
	| "AI" // AI Generated
	| "joke" // Joke or Satire
	| "misinformation" // Flagged for misinformation
	| "spam" // Flagged for spam
	| "suspicious" // Suspicious content
	| "suicide" // Deals with suicide or self-harm
	| "reported"; // Reported several times

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
	flags: {
		[flag in PostFlagType]: boolean;
	};
	interaction: {
		liked: boolean;
		reported: boolean;
		saved: false;
	};
	stats: {
		reactions: Record<PostReactionType, number>;
		answers: number;
		score: number;
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
	type: PostFlagType;
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
