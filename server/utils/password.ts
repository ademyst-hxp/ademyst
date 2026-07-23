import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt);
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
	if (!password) {
		throw new Error("Password is required");
	}

	const salt = randomBytes(16).toString("hex");
	const hash = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

	return `scrypt:${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(
	password: string,
	storedHash: string,
): Promise<boolean> {
	if (!password || !storedHash) return false;

	const [algorithm, salt, hashHex] = storedHash.split(":");
	if (algorithm !== "scrypt" || !salt || !hashHex) return false;

	const expected = Buffer.from(hashHex, "hex");
	const actual = (await scrypt(password, salt, expected.length)) as Buffer;

	if (expected.length !== actual.length) return false;

	return timingSafeEqual(expected, actual);
}
