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
export async function verifyBeamProfile(
	username: string,
	token: unknown,
): Promise<BeamProfile | null> {
	const normalizedToken =
		typeof token === "string" && token.trim() ? token.trim() : null;

	// Check username existence and token validity.
	const testRes = await fetch(
		"https://api.beam.ejnalo.me/auth/ademyst-check",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				username,
				token: normalizedToken,
			}),
		},
	);

	if (!testRes.ok) {
		throw createError({
			statusCode: 502,
			statusMessage: "Failed to check Beam username",
		});
	}

	const testData = (await testRes.json()) as {
		username: string;
		exists: boolean;
		isTokenValid: boolean;
	};

	// No Beam username: allow a normal signup.
	if (testData.exists === false) {
		return null;
	}

	// The username exists: a valid matching token is mandatory.
	if (
		testData.exists !== true ||
		!normalizedToken ||
		testData.isTokenValid !== true ||
		testData.username !== username
	) {
		throw createError({
			statusCode: 401,
			statusMessage: "Invalid Beam sudo token",
		});
	}

	// Consume the token only through account-transfer.
	const response = await fetch(
		"https://api.beam.ejnalo.me/auth/account-transfer",
		{
			method: "POST",
			headers: {
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
			statusMessage: "Failed to transfer Beam account",
		});
	}

	const profile = (await response.json()) as BeamProfile | null;

	if (!profile?.id || profile.name !== username) {
		throw createError({
			statusCode: 502,
			statusMessage: "Invalid Beam profile response",
		});
	}

	return profile;
}
