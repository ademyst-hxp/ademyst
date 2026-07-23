export type HeaderProfileContent = {
	name: string;
	displayName: string | null;
	bio: string | null;
};

export type HeaderPostContent = {
	id: string;
	content: string;
};

export function useHeaderProfileContent() {
	return useState<HeaderProfileContent | null>(
		"header-profile-content",
		() => null,
	);
}

export function useHeaderPostContent() {
	return useState<HeaderPostContent | null>(
		"header-post-content",
		() => null,
	);
}
