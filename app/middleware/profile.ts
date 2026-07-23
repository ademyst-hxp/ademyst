import type { Profile } from "~~/shared/models/profiles";

type ProfileResponse = {
	data?: Profile;
};

export default defineNuxtRouteMiddleware(async (to) => {
	const headerProfile = useHeaderProfileContent();

	const rawName = to.params.name;
	const name = Array.isArray(rawName) ? rawName[0] : rawName;

	if (!name) {
		headerProfile.value = null;
		return;
	}

	try {
		const response = await $fetch<ProfileResponse>(
			`/api/v1/users/${encodeURIComponent(name)}`,
		);

		if (!response.data) {
			headerProfile.value = null;
			return;
		}

		headerProfile.value = {
			name: response.data.name,
			displayName: response.data.displayName,
			bio: response.data.bio,
		};
	} catch {
		headerProfile.value = null;
	}
});
