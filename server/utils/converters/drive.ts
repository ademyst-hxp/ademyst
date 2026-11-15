import type { Attachment as DbAttachment } from "~~/server/db/schema/drive";

import { matchLink } from "~~/shared/consts/links";
import { ATTACHMENT_RULES } from "~~/shared/consts/specs";

import type { Attachment } from "~~/shared/models/drive";


type ConvertVisibilityOptions = {
	truncate?: boolean;
};

// URL stable d'un fichier hébergé : la route vérifie l'accès puis redirige.
export const getAttachmentFileUrl = (id: string): string =>
	`/api/v1/attachments/${id}/file`;

export function convertAttachment(
	attachment: DbAttachment,
	options: ConvertVisibilityOptions = {},
): Attachment {
	const shouldTruncate = options.truncate ?? false;

	const link = ATTACHMENT_RULES[attachment.type].external
		? attachment.link
		: getAttachmentFileUrl(attachment.id);

	return {
		id: attachment.id,
		authorId: attachment.authorId,
		postId: attachment.postId ?? null,
		type: attachment.type,
		ratio: attachment.ratio,
		title: attachment.title ?? null,
		altText: attachment.altText ?? null,
		link: shouldTruncate ? "" : link,
		// Les liens antérieurs à la colonne n'ont pas de linkType : on le déduit de l'URL.
		linkType:
			attachment.type === "link"
				? (attachment.linkType ??
					matchLink(attachment.link)?.type.id ??
					null)
				: null,
		visibility: attachment.visibility,
		createdAt: attachment.createdAt,
	};
}

export function convertSeveralAttachments(
	dbAttachments: DbAttachment[],
	options: ConvertVisibilityOptions = {},
): Attachment[] {
	return dbAttachments.map((attachment) =>
		convertAttachment(attachment, options),
	);
}
