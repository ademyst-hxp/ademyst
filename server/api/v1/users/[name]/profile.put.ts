import { useDb } from "#server/db";
import { and, eq } from "drizzle-orm/sql/expressions/conditions";

import { profiles, profileLinks } from "~~/server/db/schema/profiles";

import { getIdentity } from "#server/utils/auth";
import { verifyBeamProfile } from "#server/utils/beam";

const validatePayload = (
	payload: any,
): {
	name?: string;
	displayName?: string;
	pronouns?: string;
	bio?: string;
	location?: string;
	corporation?: string;
	token?: string;
} => {
	if (typeof payload !== "object" || payload === null) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid payload",
		});
	}

	const { name, displayName, pronouns, bio, location, corporation, token } =
		payload;

	if (
		(name !== undefined && typeof name !== "string") ||
		(displayName !== undefined && typeof displayName !== "string") ||
		(pronouns !== undefined && typeof pronouns !== "string") ||
		(bio !== undefined && typeof bio !== "string") ||
		(location !== undefined && typeof location !== "string") ||
		(corporation !== undefined && typeof corporation !== "string") ||
		(token !== undefined && typeof token !== "string")
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid payload",
		});
	}

	const trimmedName = name?.trim();

	if (trimmedName && !/^[a-zA-Z0-9_]{3,16}$/.test(trimmedName)) {
		throw createError({
			statusCode: 400,
			statusMessage:
				"Invalid username. It must be 3-16 characters long and can only contain letters, numbers, and underscores.",
		});
	}

	if (displayName && displayName.trim().length > 32) {
		throw createError({
			statusCode: 400,
			statusMessage:
				"Display name is too long. It must be 32 characters or less.",
		});
	}

	if (pronouns && pronouns.trim().length > 16) {
		throw createError({
			statusCode: 400,
			statusMessage:
				"Pronouns are too long. They must be 16 characters or less.",
		});
	}

	if (bio && bio.trim().length > 256) {
		throw createError({
			statusCode: 400,
			statusMessage:
				"Bio is too long. It must be 256 characters or less.",
		});
	}

	if (location && location.trim().length > 128) {
		throw createError({
			statusCode: 400,
			statusMessage:
				"Location is too long. It must be 128 characters or less.",
		});
	}

	return {
		name: name?.trim(),
		displayName: displayName?.trim(),
		pronouns: pronouns?.trim(),
		bio: bio?.trim(),
		location: location?.trim(),
		corporation: corporation?.trim(),
		token: token?.trim(),
	};
};

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const name = event.context.params?.name;

	const entries = await readBody(event);
	const payload = validatePayload(entries);

	const identity = await getIdentity(event);

	if (!identity) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

	if (!name) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing username",
		});
	}

	const [profile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.name, name))
		.limit(1);

	if (!profile) {
		throw createError({
			statusCode: 404,
			statusMessage: "User not found",
		});
	}

	if (profile.accountId !== identity.accountId) {
		throw createError({
			statusCode: 403,
			statusMessage: "You are not authorized to update this profile",
		});
	}

	let beamProfile: Awaited<ReturnType<typeof verifyBeamProfile>> | null =
		null;

	/*
	 * If "name" is present in the payload, Beam verification
	 * is always required — even if the requested name is
	 * identical to the current name.
	 *
	 * If "name" is absent, no request is made to Beam.
	 */
	if (payload.name !== undefined) {
		if (!payload.token) {
			throw createError({
				statusCode: 401,
				statusMessage:
					"A valid Beam sudo token is required when updating the username",
			});
		}

		beamProfile = await verifyBeamProfile(payload.token);

		const [beamLink] = await db
			.select()
			.from(profileLinks)
			.where(
				and(
					eq(profileLinks.profileId, profile.id),
					eq(profileLinks.type, "beam"),
				),
			)
			.limit(1);

		if (!beamLink) {
			throw createError({
				statusCode: 403,
				statusMessage:
					"A linked Beam account is required to update the username",
			});
		}

		/*
		 * The verified Beam account must be the Beam account
		 * already linked to this profile.
		 */
		if (beamLink.resourceId !== beamProfile.id) {
			throw createError({
				statusCode: 403,
				statusMessage:
					"The Beam token does not belong to your linked Beam account",
			});
		}

		/*
		 * The requested username must be exactly the username
		 * returned by the verified Beam account.
		 */
		if (payload.name !== beamProfile.name) {
			throw createError({
				statusCode: 403,
				statusMessage:
					"The requested username does not match your Beam username",
			});
		}

		/*
		 * Prevent claiming an existing local username.
		 */
		const [nameMatch] = await db
			.select({ id: profiles.id })
			.from(profiles)
			.where(eq(profiles.name, beamProfile.name))
			.limit(1);

		if (nameMatch && nameMatch.id !== profile.id) {
			throw createError({
				statusCode: 409,
				statusMessage: "Profile name already in use",
			});
		}

		/*
		 * FUTURE PUBLIC-SIGNUP / USERNAME PROTECTION:
		 *
		 * If Beam exposes a dedicated endpoint to verify username
		 * ownership/reservation, perform that check here too.
		 *
		 * A Beam username must never be claimed locally without
		 * successful verification of the corresponding Beam account.
		 */
	}

	/*
	 * The token is only used for Beam verification and must
	 * never be persisted in the profile.
	 */
	const { token: _token, ...profileUpdate } = payload;

	await db
		.update(profiles)
		.set(profileUpdate)
		.where(eq(profiles.id, profile.id));

	/*
	 * Keep the Beam link synchronized when "name" was supplied.
	 *
	 * This is intentionally based on beamProfile rather than
	 * payload.name because Beam is the source of truth.
	 */
	if (beamProfile) {
		await db
			.update(profileLinks)
			.set({
				name: beamProfile.display_name || beamProfile.name,
				url: `https://beam.ejnalo.me/${beamProfile.name}`,
				resourceName: beamProfile.name,
			})
			.where(
				and(
					eq(profileLinks.profileId, profile.id),
					eq(profileLinks.type, "beam"),
				),
			);
	}

	return {
		status: "ok",
	};
});
