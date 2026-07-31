export function normalizeRequiredText(value: unknown): string | null {
	if (typeof value !== "string") return null;

	const text = value.trim();

	return text.length ? text : null;
}

export function normalizeOptionalText(value: unknown): string | null {
	if (typeof value !== "string") return null;

	const text = value.trim();

	return text.length ? text : null;
}

const POST_VISIBILITY_VALUES = [
	"outside",
	"everyone",
	"followers",
	"friends",
	"me",
];

export type PostVisibility =
	"outside" | "everyone" | "followers" | "friends" | "me";

export function normalizeVisibility(value: unknown): PostVisibility | null {
	if (typeof value !== "string") return null;

	const visibility = value.trim() as PostVisibility;

	return POST_VISIBILITY_VALUES.includes(visibility) ? visibility : null;
}

export function normalizeHexColor(value: unknown): string | null {
	if (typeof value !== "string") return null;

	const hexColor = value.trim();

	if (!/^#[0-9A-Fa-f]{6}$/.test(hexColor)) return null;

	return hexColor.toLocaleLowerCase();
}
