import type { Attachment as DbAttachment } from "~~/server/db/schema/drive";
import type { Attachment } from "~~/shared/models/drive";

type ConvertVisibilityOptions = {
	truncate?: boolean;
};

export function convertAttachment(
	attachment: DbAttachment,
	options: ConvertVisibilityOptions = {},
): Attachment {
	const shouldTruncate = options.truncate ?? false;

	return {
		id: attachment.id,
		authorId: attachment.authorId,
		postId: attachment.postId ?? null,
		whisperId: attachment.whisperId ?? null,
		link: shouldTruncate ? "" : attachment.link,
		visibility: attachment.visibility,
		createdAt: attachment.createdAt,
	};
}
