import { useDb } from "#server/db";
import { attachments } from "~~/server/db/schema/drive";

import { convertAttachment } from "~~/server/utils/converters/drive";
import { useDrive } from "~~/server/utils/drive";
import {
	buildAttachmentKey,
	normalizeAttachmentType,
	normalizeExternalUrl,
	normalizeMediaRatio,
	purgeOrphanAttachments,
} from "~~/server/utils/helpers/attachments";
import { processAttachmentImage } from "~~/server/utils/helpers/files";
import { requireAuth } from "~~/server/utils/middleware/auth";
import { normalizeOptionalText } from "~~/server/utils/normalizers/interactions";
import {
	ATTACHMENT_ALT_TEXT_MAX_LENGTH,
	ATTACHMENT_RULES,
} from "~~/shared/consts/specs";
import {
	getAttachmentTypeFromMime,
	getClosestRatio,
} from "~~/shared/utils/attachments";

import type { AttachmentType, MediaRatio } from "~~/shared/models/drive";

import { createError, getRequestHeader, readBody, readMultipartFormData } from "h3";
import type { H3Event } from "h3";

const normalizeAltText = (value: unknown): string | null => {
	const altText = normalizeOptionalText(value);

	if (altText && altText.length > ATTACHMENT_ALT_TEXT_MAX_LENGTH) {
		throw createError({
			statusCode: 400,
			statusMessage: `Alt text exceeds maximum length of ${ATTACHMENT_ALT_TEXT_MAX_LENGTH} characters`,
		});
	}

	return altText;
};

// Les Attachments créés ici sont orphelins (postId null, visibilité "me")
// jusqu'à leur rattachement via POST /posts/:id/attachments.
export default defineEventHandler(async (event: H3Event) => {
	const db = useDb(event);

	const identity = await requireAuth(event, { min_level: 2 });

	const isMultipart = (getRequestHeader(event, "content-type") ?? "")
		.toLowerCase()
		.startsWith("multipart/form-data");

	let type: AttachmentType;
	let ratio: MediaRatio = "1:1";
	let altText: string | null = null;
	let link: string;
	let upload: { buffer: ArrayBuffer; contentType: string } | null = null;

	const id = globalThis.crypto.randomUUID();

	if (isMultipart) {
		const parts = await readMultipartFormData(event);

		const file = parts?.find((part) => part.name === "file");

		if (!file?.data) {
			throw createError({
				statusCode: 400,
				statusMessage: "Missing file",
			});
		}

		altText = normalizeAltText(
			parts?.find((part) => part.name === "altText")?.data.toString(),
		);

		const contentType = file.type ?? "application/octet-stream";

		type = getAttachmentTypeFromMime(contentType);

		const rule = ATTACHMENT_RULES[type];

		if (!rule.enabled || rule.external) {
			throw createError({
				statusCode: 415,
				statusMessage: `Unsupported attachment type: ${type}`,
			});
		}

		switch (type) {
			case "image": {
				const cloudflare = event.context.cloudflare;

				if (!cloudflare?.env?.IMAGES) {
					throw createError({
						statusCode: 500,
						statusMessage:
							"Cloudflare Images binding is not configured",
					});
				}

				const image = await processAttachmentImage(
					file.data,
					contentType,
					cloudflare.env.IMAGES,
				);

				ratio = getClosestRatio(image.width, image.height);
				upload = {
					buffer: image.buffer,
					contentType: image.contentType,
				};
				break;
			}
			default:
				throw createError({
					statusCode: 415,
					statusMessage: `Unsupported attachment type: ${type}`,
				});
		}

		link = buildAttachmentKey(id);
	} else {
		const body = await readBody(event);

		const requestedType = normalizeAttachmentType(body?.type);

		if (!requestedType || !ATTACHMENT_RULES[requestedType].external) {
			throw createError({
				statusCode: 400,
				statusMessage: "Invalid attachment type",
			});
		}

		if (!ATTACHMENT_RULES[requestedType].enabled) {
			throw createError({
				statusCode: 415,
				statusMessage: `Unsupported attachment type: ${requestedType}`,
			});
		}

		type = requestedType;
		link = normalizeExternalUrl(body?.link);
		altText = normalizeAltText(body?.altText);
		ratio = normalizeMediaRatio(body?.ratio) ?? "16:9";
	}

	await purgeOrphanAttachments(event, identity.profileId);

	if (upload) {
		const storage = useDrive(event, "files");

		await storage.put(link, upload.buffer, {
			contentType: upload.contentType,
		});
	}

	const [created] = await db
		.insert(attachments)
		.values({
			id,
			authorId: identity.profileId,
			postId: null,
			type,
			ratio,
			altText,
			link,
			visibility: "me",
		})
		.returning();

	if (!created) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to create attachment",
		});
	}

	return {
		status: "ok",
		data: convertAttachment(created),
	};
});
