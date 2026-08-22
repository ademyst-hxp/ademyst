import { useDb } from "#server/db";
import { and, eq } from "drizzle-orm/sql/expressions/conditions";

import { profiles, profileLinks } from "~~/server/db/schema/profiles";

import { normalizeUUID } from "~~/server/utils/normalizers/ids";

export default defineEventHandler(async (event) => {
	const db = useDb(event);

	const body = await readBody(event);

	const identity = await requireAuth(event);

	const token: string | null = normalizeUUID(body?.token);
	const transferProfile: boolean = body?.transferProfile || false;

	if (!token || typeof token !== "string") {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid payload",
		});
	}

	const [existingProfile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, identity.profileId))
		.limit(1);

	if (!existingProfile) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to retrieve existing profile",
		});
	}

	type BeamPayload = {
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
			colors: { stops: string[]; primary: string };
			icon: string;
			rarity: number;
		};
		followers: number;
		following: number;
	};

	const res = await fetch(
		`https://api.beam.ejnalo.me/auth/account-transfer`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				token,
			}),
		},
	).then((r) => r.json() as Promise<BeamPayload | null>);

	if (!res || !res.name) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid token",
		});
	}

	const existingLink = await db
		.select()
		.from(profileLinks)
		.where(
			and(
				eq(profileLinks.profileId, identity.profileId),
				eq(profileLinks.type, "beam"),
			),
		)
		.limit(1);

	if (existingLink) {
		throw createError({
			statusCode: 409,
			statusMessage: "Beam account already linked",
		});
	}

	if (transferProfile) {
		await db
			.update(profiles)
			.set({
				displayName: res.display_name || undefined,
				bio: res.description || undefined,
				pronouns: res.pronouns || undefined,
				birthday: res.birthday ? new Date(res.birthday).toISOString().split("T")[0] : undefined,
			})
			.where(eq(profiles.id, identity.profileId));
	}

	await db.insert(profileLinks).values([
		{
			profileId: identity.profileId,
			name: res.display_name || res.name,
			type: "beam",
			resourceId: res.id,
			resourceName: res.name,
		},
	]);

	return {
		status: "ok",
	};
});
