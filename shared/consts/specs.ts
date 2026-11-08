import type { AttachmentGroup, AttachmentType } from "~~/shared/models/drive";

export const POST_CHAR_LIMITS: Record<number, number> = {
	0: 0,
	1: 1000,
	2: 1000,
	3: 1000,
	4: 2000,
	5: 5000,
	6: 5000,
	7: 5000,
	8: 5000,
	9: 5000,
} as const;

export const POST_MEDIA_LIMITS: Record<number, {
	images: number;
	gifs: number;
	videos: number;
	audios: number;
	links: number;
}> = {
	// Les vidéos sont à 0 tant que les buckets n'en acceptent pas.
	0: { images: 0, gifs: 0, videos: 0, audios: 0, links: 0 },
	1: { images: 0, gifs: 0, videos: 0, audios: 0, links: 0 },
	2: { images: 2, gifs: 1, videos: 0, audios: 1, links: 3 },
	3: { images: 2, gifs: 1, videos: 0, audios: 1, links: 3 },
	4: { images: 4, gifs: 1, videos: 0, audios: 2, links: 5 },
	5: { images: 6, gifs: 1, videos: 0, audios: 2, links: 10 },
	6: { images: 6, gifs: 1, videos: 0, audios: 2, links: 10 },
	7: { images: 6, gifs: 1, videos: 0, audios: 2, links: 10 },
	8: { images: 6, gifs: 1, videos: 0, audios: 2, links: 10 },
	9: { images: 6, gifs: 1, videos: 0, audios: 2, links: 10 },
} as const;

/*
 * Règles des Attachments (données pures, sans icônes : utilisables côté serveur).
 * - group    : regroupement côté interface
 * - external : le lien pointe vers une ressource externe (pas de fichier hébergé)
 * - enabled  : accepté pour l'instant (buckets : images uniquement)
 */
export const ATTACHMENT_RULES: Record<
	AttachmentType,
	{
		group: AttachmentGroup;
		external: boolean;
		enabled: boolean;
		mimeTypes: readonly string[];
	}
> = {
	image: {
		group: "media",
		external: false,
		enabled: true,
		mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
	},
	video: {
		group: "media",
		external: false,
		enabled: false,
		mimeTypes: ["video/mp4", "video/webm"],
	},
	gif: { group: "gifs", external: true, enabled: false, mimeTypes: [] },
	link: { group: "links", external: true, enabled: true, mimeTypes: [] },
	audio: {
		group: "others",
		external: false,
		enabled: false,
		mimeTypes: ["audio/mpeg", "audio/ogg", "audio/wav", "audio/webm"],
	},
	other: { group: "others", external: false, enabled: false, mimeTypes: [] },
} as const;

export const ATTACHMENT_MAX_FILE_SIZE = 1 * 1024 * 1024;
export const ATTACHMENT_ALT_TEXT_MAX_LENGTH = 500;
export const ATTACHMENT_LINK_MAX_LENGTH = 2048;

export const WHISPER_CHAR_LIMITS: Record<number, number> = {
	0: 0,
	1: 250,
	2: 250,
	3: 250,
	4: 250,
	5: 250,
	6: 250,
	7: 250,
	8: 250,
	9: 250,
} as const;
