import { domains } from "~~/shared/consts/links";
import { ATTACHMENT_RULES } from "~~/shared/consts/specs";

import type {
	Attachment,
	AttachmentGroup,
	AttachmentType,
	MediaRatio,
} from "~~/shared/models/drive";

import type { getPostSpecs } from "./interactions";

type Typed = Pick<Attachment, "type">;

export const RATIOS: Record<MediaRatio, number> = {
	"16:9": 16 / 9,
	"5:4": 5 / 4,
	"4:3": 4 / 3,
	"3:2": 3 / 2,
	"1:1": 1,
	"2:3": 2 / 3,
	"3:4": 3 / 4,
	"4:5": 4 / 5,
	"9:16": 9 / 16,
};

export const isMediaRatio = (value: unknown): value is MediaRatio =>
	typeof value === "string" && value in RATIOS;

// Ratio normalisé le plus proche d'une dimension réelle.
export const getClosestRatio = (width: number, height: number): MediaRatio => {
	if (!width || !height) return "1:1";

	const target = width / height;

	return (Object.entries(RATIOS) as [MediaRatio, number][]).reduce(
		(best, [ratio, value]) =>
			Math.abs(value - target) < Math.abs(RATIOS[best] - target)
				? ratio
				: best,
		"1:1" as MediaRatio,
	);
};

// "16:9" -> "16 / 9" (propriété CSS aspect-ratio)
export const ratioToCss = (ratio: MediaRatio): string =>
	ratio.replace(":", " / ");

export const getAttachmentGroup = (type: AttachmentType): AttachmentGroup =>
	ATTACHMENT_RULES[type].group;

export const isExternalAttachment = (attachment: Typed): boolean =>
	ATTACHMENT_RULES[attachment.type].external;

// Un media est une image ou une vidéo ; l'audio n'en est pas un.
export const isMediaAttachment = (attachment: Typed): boolean =>
	getAttachmentGroup(attachment.type) === "media";

export const groupAttachments = <T extends Typed>(
	attachments: T[],
): Record<AttachmentGroup, T[]> =>
	attachments.reduce(
		(acc, attachment) => {
			acc[getAttachmentGroup(attachment.type)].push(attachment);
			return acc;
		},
		{ media: [], gifs: [], links: [], others: [] } as Record<
			AttachmentGroup,
			T[]
		>,
	);

export const getAttachmentTypeFromMime = (mime: string): AttachmentType => {
	const normalized = mime.split(";")[0]!.trim().toLowerCase();

	const found = (
		Object.entries(ATTACHMENT_RULES) as [
			AttachmentType,
			(typeof ATTACHMENT_RULES)[AttachmentType],
		][]
	).find(([, rule]) => rule.mimeTypes.includes(normalized));

	return found ? found[0] : "other";
};

export const getAttachmentLimit = (
	type: AttachmentType,
	specs: ReturnType<typeof getPostSpecs>,
): number => {
	switch (type) {
		case "image":
			return specs.max_images;
		case "video":
			return specs.max_videos;
		case "gif":
			return specs.max_gifs;
		case "audio":
			return specs.max_audios;
		case "link":
			return specs.max_links;
		default:
			return 0;
	}
};

// Places restantes par type (négatif impossible).
export const getRemainingSlots = (
	attachments: Typed[],
	specs: ReturnType<typeof getPostSpecs>,
): Record<AttachmentType, number> =>
	(Object.keys(ATTACHMENT_RULES) as AttachmentType[]).reduce(
		(acc, type) => {
			const used = attachments.filter((a) => a.type === type).length;

			acc[type] = Math.max(0, getAttachmentLimit(type, specs) - used);
			return acc;
		},
		{} as Record<AttachmentType, number>,
	);

// Domaine connu (cf. shared/consts/links.ts) d'un lien, s'il existe.
export const getLinkDomain = (link: string) => {
	try {
		const hostname = new URL(link).hostname
			.toLowerCase()
			.replace(/^www\./, "");

		return { hostname, domain: domains[hostname] ?? null };
	} catch {
		return { hostname: link, domain: null };
	}
};
