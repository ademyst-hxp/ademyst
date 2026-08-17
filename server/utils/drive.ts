import type { H3Event } from "h3";
import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type Storage = ReturnType<typeof createStorage>;

function createStorage() {
	const endpoint = process.env.R2_ENDPOINT;
	const accessKeyId = process.env.R2_ACCESS_KEY_ID;
	const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
	const bucket = process.env.R2_BUCKET;

	if (!endpoint) {
		throw new Error("No R2 endpoint found (R2_ENDPOINT)");
	}

	if (!accessKeyId) {
		throw new Error("No R2 access key found (R2_ACCESS_KEY_ID)");
	}

	if (!secretAccessKey) {
		throw new Error("No R2 secret key found (R2_SECRET_ACCESS_KEY)");
	}

	if (!bucket) {
		throw new Error("No R2 bucket found (R2_BUCKET)");
	}

	const client = new S3Client({
		region: "auto",
		endpoint,
		credentials: {
			accessKeyId,
			secretAccessKey,
		},
	});

	return {
		client,
		bucket,

		async put(
			key: string,
			body: PutObjectCommand["input"]["Body"],
			options?: {
				contentType?: string;
				cacheControl?: string;
				contentDisposition?: string;
				metadata?: Record<string, string>;
			},
		) {
			return client.send(
				new PutObjectCommand({
					Bucket: bucket,
					Key: key,
					Body: body,
					ContentType: options?.contentType,
					CacheControl: options?.cacheControl,
					ContentDisposition: options?.contentDisposition,
					Metadata: options?.metadata,
				}),
			);
		},

		async get(key: string) {
			return client.send(
				new GetObjectCommand({
					Bucket: bucket,
					Key: key,
				}),
			);
		},

		async delete(key: string) {
			await client.send(
				new DeleteObjectCommand({
					Bucket: bucket,
					Key: key,
				}),
			);
		},

		async exists(key: string) {
			try {
				await client.send(
					new HeadObjectCommand({
						Bucket: bucket,
						Key: key,
					}),
				);

				return true;
			} catch {
				return false;
			}
		},

		async list(prefix?: string) {
			const response = await client.send(
				new ListObjectsV2Command({
					Bucket: bucket,
					Prefix: prefix,
				}),
			);

			return response.Contents ?? [];
		},

		async signedUrl(
			key: string,
			options?: {
				expiresIn?: number;
			},
		) {
			return getSignedUrl(
				client,
				new GetObjectCommand({
					Bucket: bucket,
					Key: key,
				}),
				{
					expiresIn: options?.expiresIn ?? 3600,
				},
			);
		},
	};
}

// Cloudflare Workers can't reuse I/O objects across requests,
// so the storage client is created once per request.
const storageByEvent = new WeakMap<H3Event, Storage>();

export function useStorage(event: H3Event): Storage {
	const cached = storageByEvent.get(event);

	if (cached) {
		return cached;
	}

	const storage = createStorage();

	storageByEvent.set(event, storage);

	return storage;
}
