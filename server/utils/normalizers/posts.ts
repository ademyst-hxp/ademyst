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
	| "outside"
	| "everyone"
	| "followers"
	| "friends"
	| "me";

export function normalizeVisibility(value: unknown): PostVisibility | null {
	if (typeof value !== "string") return null;

	const visibility = value.trim() as PostVisibility;

	return POST_VISIBILITY_VALUES.includes(visibility) ? visibility : null;
}
