import type { H3Event } from "h3";

import {
	S3Client,
	GetObjectCommand,
	PutObjectCommand,
	DeleteObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function useS3(event: H3Event) {
	if (event.context.s3) {
		return event.context.s3;
	}

	const env = event.context.cloudflare.env;

	const client = new S3Client({
		region: "auto",
		endpoint: env.S3_ENDPOINT,
		credentials: {
			accessKeyId: env.S3_ACCESS_KEY_ID,
			secretAccessKey: env.S3_SECRET_ACCESS_KEY,
		},
	});

	event.context.s3 = client;

	return client;
}

export class ObjectStorage {
	constructor(
		private readonly s3: S3Client,
		private readonly bucket: string,
	) {}

	async exists(key: string): Promise<boolean> {
		try {
			await this.s3.send(
				new HeadObjectCommand({
					Bucket: this.bucket,
					Key: key,
				}),
			);

			return true;
		} catch (error: any) {
			if (error?.$metadata?.httpStatusCode === 404) {
				return false;
			}

			throw error;
		}
	}

	async get(key: string) {
		return this.s3.send(
			new GetObjectCommand({
				Bucket: this.bucket,
				Key: key,
			}),
		);
	}

	async put(
		key: string,
		body: PutObjectCommand["input"]["Body"],
		options: Omit<
			PutObjectCommand["input"],
			"Bucket" | "Key" | "Body"
		> = {},
	) {
		return this.s3.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: body,
				...options,
			}),
		);
	}

	async delete(key: string) {
		return this.s3.send(
			new DeleteObjectCommand({
				Bucket: this.bucket,
				Key: key,
			}),
		);
	}

	async list(prefix?: string) {
		return this.s3.send(
			new ListObjectsV2Command({
				Bucket: this.bucket,
				Prefix: prefix,
			}),
		);
	}

	async signedUrl(
		key: string,
		options: {
			expiresIn?: number;
		} = {},
	) {
		return getSignedUrl(
			this.s3,
			new GetObjectCommand({
				Bucket: this.bucket,
				Key: key,
			}),
			{
				expiresIn: options.expiresIn ?? 3600,
			},
		);
	}

	async signedUploadUrl(
		key: string,
		options: {
			expiresIn?: number;
			contentType?: string;
		} = {},
	) {
		return getSignedUrl(
			this.s3,
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				...(options.contentType
					? { ContentType: options.contentType }
					: {}),
			}),
			{
				expiresIn: options.expiresIn ?? 900,
			},
		);
	}
}
