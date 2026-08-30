const ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 512;
const SALT_LENGTH_BYTES = 16;

// Web Crypto (crypto.subtle) is used instead of node:crypto's scrypt because
// Cloudflare Workers doesn't implement scrypt (CPU-hard KDFs are disallowed
// under Workers' per-request CPU time limits). PBKDF2 is natively supported
// identically on both Node and Workers.

async function deriveKey(
	password: string,
	salt: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array<ArrayBuffer>> {
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);

	const bits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt,
			iterations: ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		KEY_LENGTH_BITS,
	);

	return new Uint8Array(bits);
}

function toHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((byte: number) => byte.toString(16).padStart(2, "0"))
		.join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
	if (hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) {
		throw new Error("Invalid hexadecimal string");
	}

	const bytes = new Uint8Array(hex.length / 2);

	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}

	return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) {
		return false;
	}

	let diff = 0;

	for (let i = 0; i < a.length; i++) {
		diff |= a[i]! ^ b[i]!;
	}

	return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
	if (!password) {
		throw new Error("Password is required");
	}

	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));

	const hash = await deriveKey(password, salt);

	return `pbkdf2:${toHex(salt)}:${toHex(hash)}`;
}

export async function verifyPassword(
	password: string,
	storedHash: string,
): Promise<boolean> {
	if (!password || !storedHash) {
		return false;
	}

	const parts = storedHash.split(":");

	if (parts.length !== 3) {
		return false;
	}

	const [algorithm, saltHex, hashHex] = parts;

	if (algorithm !== "pbkdf2" || !saltHex || !hashHex) {
		return false;
	}

	let salt: Uint8Array<ArrayBuffer>;
	let expected: Uint8Array<ArrayBuffer>;

	try {
		salt = fromHex(saltHex);
		expected = fromHex(hashHex);
	} catch {
		return false;
	}

	const actual = await deriveKey(password, salt);

	return timingSafeEqual(expected, actual);
}
