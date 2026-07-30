const ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 512;

// Web Crypto (crypto.subtle) is used instead of node:crypto's scrypt because
// Cloudflare Workers doesn't implement scrypt (CPU-hard KDFs are disallowed
// under Workers' per-request CPU time limits). PBKDF2 is natively supported
// identically on both Node and Workers.
async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
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
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

function fromHex(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);

	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
	}

	return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) return false;

	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= a[i] ^ b[i];
	}

	return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
	if (!password) {
		throw new Error("Password is required");
	}

	const salt = crypto.getRandomValues(new Uint8Array(16));
	const hash = await deriveKey(password, salt);

	return `pbkdf2:${toHex(salt)}:${toHex(hash)}`;
}

export async function verifyPassword(
	password: string,
	storedHash: string,
): Promise<boolean> {
	if (!password || !storedHash) return false;

	const [algorithm, saltHex, hashHex] = storedHash.split(":");
	if (algorithm !== "pbkdf2" || !saltHex || !hashHex) return false;

	const salt = fromHex(saltHex);
	const expected = fromHex(hashHex);
	const actual = await deriveKey(password, salt);

	return timingSafeEqual(expected, actual);
}
