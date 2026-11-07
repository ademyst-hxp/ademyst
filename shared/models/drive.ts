export type AttachmentVisibility =
	"outside" | "everyone" | "followers" | "friends" | "me";

export type AttachmentType =
	"image" | "gif" | "audio" | "link" | "other";

export type MediaRatio =
	"16:9" | "5:4" | "4:3" | "3:2" | "1:1" | "2:3" | "3:4" | "4:5" | "9:16";

export type Attachment = {
	id: string;
	authorId: string;
	postId: string | null;
	type: AttachmentType;
	ratio: MediaRatio;
	altText: string | null;
	link: string; // Pour les GIFs et les liens externes
	visibility: AttachmentVisibility;
	createdAt: Date;
};
