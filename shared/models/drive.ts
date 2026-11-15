export type AttachmentVisibility =
	"outside" | "everyone" | "followers" | "friends" | "me";

export type AttachmentType =
	"image" | "video" | "gif" | "audio" | "link" | "other";

// Regroupement côté interface (cf. shared/consts/attachments.ts)
export type AttachmentGroup = "media" | "gifs" | "links" | "others";

export type MediaRatio =
	"16:9" | "5:4" | "4:3" | "3:2" | "1:1" | "2:3" | "3:4" | "4:5" | "9:16";

export type Attachment = {
	id: string;
	authorId: string;
	postId: string | null;
	type: AttachmentType;
	ratio: MediaRatio;
	title: string | null;
	altText: string | null;
	link: string; // URL affichable : fichier hébergé (route /file), GIF ou lien externe
	linkType: string | null; // id du registre des liens (ex: "youtube_video"), null hors lien reconnu
	visibility: AttachmentVisibility;
	createdAt: Date;
};
