import type { H3Event } from "h3";
import { S3mini } from "s3mini";

type StorageBody = string | Uint8Array | ArrayBuffer | ReadableStream;

type StoragePutOptions = {
	contentType?: string;
};

type SignedUrlOptions = {
	expiresIn?: number;
};

export class ObjectStorage {
	constructor(private readonly s3: S3mini) {}

	async exists(key: string): Promise<boolean> {
		return await this.s3.objectExists(key) || false;
	}

	async get(key: string) {
		return this.s3.getObject(key);
	}

	async getResponse(key: string) {
		return this.s3.getObjectResponse(key);
	}

	async put(key: string, body: StorageBody, options: StoragePutOptions = {}) {
		return this.s3.putObject(key, body, options.contentType);
	}

	async delete(key: string) {
		return this.s3.deleteObject(key);
	}

	async list(prefix?: string) {
		return this.s3.listObjects("/", prefix);
	}

	async signedUrl(key: string, options: SignedUrlOptions = {}) {
		return this.s3.getPresignedUrl("GET", key, options.expiresIn ?? 3600);
	}

	async signedUploadUrl(
		key: string,
		options: SignedUrlOptions & {
			contentType?: string;
		} = {},
	) {
		return this.s3.getPresignedUrl(
			"PUT",
			key,
			options.expiresIn ?? 900,
			{},
			options.contentType
				? {
						"Content-Type": options.contentType,
					}
				: undefined,
		);
	}
}

export function useDrive(event: H3Event, bucket: string): ObjectStorage {
	if (event.context.storage) {
		return event.context.storage;
	}

	const env = event.context.cloudflare.env;

	const s3 = new S3mini({
		accessKeyId: env.S3_ACCESS_KEY_ID,
		secretAccessKey: env.S3_SECRET_ACCESS_KEY,
		endpoint: env.S3_ENDPOINT + `/${bucket}`,
		region: "auto",
	});

	const storage = new ObjectStorage(s3);

	event.context.storage = storage;

	return storage;
}
