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
	const config = useRuntimeConfig().private;

	const endpoint = config.s3Endpoint;
	const accessKeyId = config.s3AccessKeyId;
	const secretAccessKey = config.s3SecretAccessKey;
	const region = config.s3Region ?? "auto";

	if (!endpoint) {
		throw new Error("No S3 endpoint found (S3_ENDPOINT)");
	}

	if (!accessKeyId) {
		throw new Error("No S3 access key found (S3_ACCESS_KEY_ID)");
	}

	if (!secretAccessKey) {
		throw new Error("No S3 secret key found (S3_SECRET_ACCESS_KEY)");
	}

	const client = new S3Client({
		forcePathStyle: true,
		region,
		endpoint,
		credentials: {
			accessKeyId,
			secretAccessKey,
		},
	});

	return {
		client,

		async put(
			bucket: string,
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

		async get(bucket: string, key: string) {
			return client.send(
				new GetObjectCommand({
					Bucket: bucket,
					Key: key,
				}),
			);
		},

		async delete(bucket: string, key: string) {
			await client.send(
				new DeleteObjectCommand({
					Bucket: bucket,
					Key: key,
				}),
			);
		},

		async exists(bucket: string, key: string) {
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

		async list(bucket: string, prefix?: string) {
			const response = await client.send(
				new ListObjectsV2Command({
					Bucket: bucket,
					Prefix: prefix,
				}),
			);

			return response.Contents ?? [];
		},

		async signedUrl(
			bucket: string,
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
