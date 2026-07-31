export type AttachmentVisibility =
	| "outside"
	| "everyone"
	| "followers"
	| "friends"
	| "me";

export type Attachment = {
	id: string;
	authorId: string;
	postId: string | null;
	whisperId: string | null;
	link: string;
	visibility: AttachmentVisibility;
	createdAt: Date;
};
