import type { Attachment as DbAttachment } from "~~/server/db/schema/drive";

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
		altText: attachment.altText ?? null,
		link: shouldTruncate ? "" : link,
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
