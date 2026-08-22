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

type Storage = ReturnType<typeof createDrive>;

function createDrive() {
	const endpoint = process.env.S3_ENDPOINT;
	const accessKeyId = process.env.S3_ACCESS_KEY_ID;
	const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
	const bucket = process.env.S3_BUCKET_NAME;
	const region = process.env.S3_REGION ?? "auto";

	if (!endpoint) {
		throw new Error("No S3 endpoint found (S3_ENDPOINT)");
	}

	if (!accessKeyId) {
		throw new Error("No S3 access key found (S3_ACCESS_KEY_ID)");
	}

	if (!secretAccessKey) {
		throw new Error("No S3 secret key found (S3_SECRET_ACCESS_KEY)");
	}

	if (!bucket) {
		throw new Error("No S3 bucket found (S3_BUCKET_NAME)");
	}

	const client = new S3Client({
		region,
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

export function useDrive(event: H3Event): Storage {
	const cached = storageByEvent.get(event);

	if (cached) {
		return cached;
	}

	const storage = createDrive();
	storageByEvent.set(event, storage);

	return storage;
}
