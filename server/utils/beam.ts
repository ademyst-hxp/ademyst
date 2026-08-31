export type BeamProfile = {
	id: string;
	name: string;
	display_name: string | null;
	creation_date: string;
	update_date: string;
	status: string | null;
	description: string | null;
	birthday: string | null;
	pronouns: string | null;
	account_type: string;
	level: number;
	badge: {
		id: string;
		title: string;
		description: string;
		colors: {
			stops: string[];
			primary: string;
		};
		icon: string;
		rarity: number;
	};
	followers: number;
	following: number;
};

/**
 * Verifies a Beam sudo token and returns the associated Beam profile.
 *
 * A valid token is mandatory. Never use this function as a "best effort"
 * verification: an invalid token always throws.
 */
export async function verifyBeamProfile(token: unknown): Promise<BeamProfile> {
	if (typeof token !== "string" || !token.trim()) {
		throw createError({
			statusCode: 401,
			statusMessage: "Beam verification required",
		});
	}

	const normalizedToken = token.trim();

	const response = await fetch(
		"https://api.beam.ejnalo.me/auth/account-transfer",
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${normalizedToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				token: normalizedToken,
			}),
		},
	);

	if (!response.ok) {
		throw createError({
			statusCode: 401,
			statusMessage: "Invalid Beam sudo token",
		});
	}

	const profile = (await response.json()) as BeamProfile | null;

	if (!profile?.id || !profile.name) {
		throw createError({
			statusCode: 401,
			statusMessage: "Invalid Beam sudo token",
		});
	}

	return profile;
}
