import sharp from "sharp";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // Je suis pas Elon Musk
const MAX_WIDTH = 8192;
const MAX_HEIGHT = 8192;
const MAX_PIXELS = 25_000_000;

const ALLOWED_MIME_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/avif",
]);

export interface ProcessedImage {
	buffer: Buffer;
	width: number;
	height: number;
	size: number;
	contentType: "image/webp";
}

export async function processImage(
	input: Buffer,
	contentType: string,
): Promise<ProcessedImage> {
	if (!ALLOWED_MIME_TYPES.has(contentType)) {
		throw createError({
			statusCode: 415,
			statusMessage: "Unsupported image type",
		});
	}

	if (input.length > MAX_FILE_SIZE) {
		throw createError({
			statusCode: 413,
			statusMessage: "Image is too large",
		});
	}

	const image = sharp(input, {
		limitInputPixels: MAX_PIXELS,
	});

	const metadata = await image.metadata();

	if (!metadata.width || !metadata.height) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid image",
		});
	}

	if (metadata.width > MAX_WIDTH) {
		throw createError({
			statusCode: 400,
			statusMessage: `Image width exceeds ${MAX_WIDTH}px`,
		});
	}

	if (metadata.height > MAX_HEIGHT) {
		throw createError({
			statusCode: 400,
			statusMessage: `Image height exceeds ${MAX_HEIGHT}px`,
		});
	}

	const pixels = metadata.width * metadata.height;

	if (pixels > MAX_PIXELS) {
		throw createError({
			statusCode: 400,
			statusMessage: "Image contains too many pixels",
		});
	}

	const buffer = await image
		.resize({
			width: 4096,
			height: 4096,
			fit: "inside",
			withoutEnlargement: true,
		})
		.webp({
			quality: 82,
		})
		.toBuffer();

	const outputMetadata = await sharp(buffer).metadata();

	return {
		buffer,
		width: outputMetadata.width!,
		height: outputMetadata.height!,
		size: buffer.length,
		contentType: "image/webp",
	};
}

export async function processAvatar(input: Buffer, contentType: string) {
	if (!ALLOWED_MIME_TYPES.has(contentType)) {
		throw createError({
			statusCode: 415,
			statusMessage: "Unsupported image type",
		});
	}

	if (input.length > MAX_FILE_SIZE) {
		throw createError({
			statusCode: 413,
			statusMessage: "Avatar is too large",
		});
	}

	const image = sharp(input, {
		limitInputPixels: MAX_PIXELS,
	});

	const metadata = await image.metadata();

	if (!metadata.width || !metadata.height) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid image",
		});
	}

	if (metadata.width * metadata.height > MAX_PIXELS) {
		throw createError({
			statusCode: 400,
			statusMessage: "Image contains too many pixels",
		});
	}

	const buffer = await image
		.resize(512, 512, {
			fit: "cover",
			position: "centre",
			withoutEnlargement: false,
		})
		.webp({
			quality: 85,
		})
		.toBuffer();

	return {
		buffer,
		width: 512,
		height: 512,
		size: buffer.length,
		contentType: "image/webp" as const,
	};
}
