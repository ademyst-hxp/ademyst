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
	buffer: ArrayBuffer;
	width: number;
	height: number;
	size: number;
	contentType: "image/webp";
}

interface ImagesBinding {
	info(image: ReadableStream<Uint8Array>): Promise<{
		width?: number;
		height?: number;
	}>;

	input(image: ReadableStream<Uint8Array>): {
		transform(options: {
			width?: number;
			height?: number;
			fit?: "scale-down" | "contain" | "cover" | "crop" | "pad";
		}): {
			output(options: { format: "image/webp"; quality?: number }): {
				response(): Promise<Response>;
			};
		};
	};
}

function normalizeContentType(contentType: string | undefined): string {
	return (contentType ?? "").split(";")[0]!.trim().toLowerCase();
}

function toUint8Array(input: ArrayBuffer | Uint8Array): Uint8Array {
	if (input instanceof Uint8Array) {
		return input;
	}

	return new Uint8Array(input);
}

function toImageStream(
	input: ArrayBuffer | Uint8Array,
): ReadableStream<Uint8Array> {
	const bytes = toUint8Array(input);

	return new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(bytes);
			controller.close();
		},
	});
}

async function validateImage(
	input: ArrayBuffer | Uint8Array,
	contentType: string,
	images: ImagesBinding,
	name: string,
) {
	const normalizedContentType = normalizeContentType(contentType);

	if (!ALLOWED_MIME_TYPES.has(normalizedContentType)) {
		throw createError({
			statusCode: 415,
			statusMessage: `Unsupported image type: ${
				normalizedContentType || "unknown"
			}`,
		});
	}

	if (input.byteLength > MAX_FILE_SIZE) {
		throw createError({
			statusCode: 413,
			statusMessage: `${name} is too large`,
		});
	}

	const metadata = await images.info(toImageStream(input));

	const width = metadata.width ?? 0;
	const height = metadata.height ?? 0;

	if (!width || !height) {
		throw createError({
			statusCode: 415,
			statusMessage: `${name} has invalid dimensions`,
		});
	}

	if (width > MAX_WIDTH || height > MAX_HEIGHT) {
		throw createError({
			statusCode: 413,
			statusMessage: `${name} dimensions are too large`,
		});
	}

	if (width * height > MAX_PIXELS) {
		throw createError({
			statusCode: 413,
			statusMessage: `${name} has too many pixels`,
		});
	}

	return {
		width,
		height,
	};
}

async function transformToWebp(
	input: ArrayBuffer | Uint8Array,
	images: ImagesBinding,
	width: number,
	height: number,
	quality: number,
): Promise<ArrayBuffer> {
	const result = await (
		await images
			.input(toImageStream(input))
			.transform({
				width,
				height,
				fit: "cover",
			})
			.output({
				format: "image/webp",
				quality,
			})
	).response();

	if (!result.ok) {
		throw createError({
			statusCode: 500,
			statusMessage: `Image transformation failed: ${result.status} ${result.statusText}`,
		});
	}

	return result.arrayBuffer();
}

export async function processImage(
	input: ArrayBuffer | Uint8Array,
	contentType: string,
	images: ImagesBinding,
): Promise<ProcessedImage> {
	const metadata = await validateImage(input, contentType, images, "Image");

	const buffer = await transformToWebp(input, images, 4096, 4096, 82);

	const output = new Uint8Array(buffer);

	return {
		buffer,
		width: metadata.width,
		height: metadata.height,
		size: output.byteLength,
		contentType: "image/webp",
	};
}

export async function processAvatar(
	input: ArrayBuffer | Uint8Array,
	contentType: string,
	images: ImagesBinding,
): Promise<ProcessedImage> {
	await validateImage(input, contentType, images, "Avatar");

	const buffer = await transformToWebp(input, images, 512, 512, 85);

	return {
		buffer,
		width: 512,
		height: 512,
		size: buffer.byteLength,
		contentType: "image/webp",
	};
}

export async function processBadgeIcon(
	input: ArrayBuffer | Uint8Array,
	contentType: string,
	images: ImagesBinding,
): Promise<ProcessedImage> {
	await validateImage(input, contentType, images, "Badge icon");

	const buffer = await transformToWebp(input, images, 512, 512, 90);

	return {
		buffer,
		width: 512,
		height: 512,
		size: buffer.byteLength,
		contentType: "image/webp",
	};
}
