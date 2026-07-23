import { randomBytes } from "node:crypto";

const MIN_HEX_ID_LENGTH = 6;
const MAX_HEX_ID_LENGTH = 10;

export function generateHexId(length = MAX_HEX_ID_LENGTH): string {
	if (length < MIN_HEX_ID_LENGTH || length > MAX_HEX_ID_LENGTH) {
		throw new Error(
			`Hex ID length must be between ${MIN_HEX_ID_LENGTH} and ${MAX_HEX_ID_LENGTH}`,
		);
	}

	const bytes = Math.ceil(length / 2);

	return randomBytes(bytes).toString("hex").slice(0, length);
}
