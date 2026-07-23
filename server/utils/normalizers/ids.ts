export function normalizeId(value: unknown): string | null {
	if (typeof value !== "string") return null;

	const id = value.trim();

	return id.length ? id : null;
}

export const normalizeUUID = (value: unknown): string | null => {
	if (!value) return null;
	if (typeof value !== "string") return null;

	const valueRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

	if (!valueRegex.test(value)) {
		return null;
	}

	const uuid = value.trim();

	return uuid.length ? uuid : null;
};
