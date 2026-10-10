import { eq, and } from "drizzle-orm";

import { useDb } from "../db";
import type { H3Event } from "h3";

import { profiles, Profile } from "../db/schema/profiles";
import { accounts, Account, sessions } from "../db/schema/accounts";
import {
	levelsEntitlements,
	type LevelEntitlement,
} from "../db/schema/entitlements";

export interface Identity {
	profileId: string;
	accountId: string;
}

export interface UserIdentity extends Identity {
	profile: Profile;
	account: Account;
}

export const getIdentity = async (event: H3Event): Promise<Identity | null> => {
	const db = useDb(event);

	const authorization = getHeader(event, "Authorization");
	const accessTokenCookie = getCookie(event, "accessToken");

	const token = getBearerToken(authorization) ?? accessTokenCookie ?? null;

	if (!token) {
		return null;
	}

	try {
		const payload = await verifyAccessToken(token);

		const session = await db
			.select()
			.from(sessions)
			.where(eq(sessions.accountId, payload.sub ?? ""))
			.limit(1);

		if (!session || session.length === 0) {
			return null;
		}

		return {
			profileId: payload.profileId,
			accountId: payload.sub ?? "",
		};
	} catch {
		return null;
	}
};

export const getUser = async (
	event: H3Event,
	identity: Identity,
): Promise<UserIdentity | null> => {
	const db = useDb(event);

	const [[profile], [account]] = await Promise.all([
		db
			.select()
			.from(profiles)
			.where(eq(profiles.id, identity.profileId))
			.limit(1),
		db
			.select()
			.from(accounts)
			.where(eq(accounts.id, identity.accountId))
			.limit(1),
	]);

	if (!profile || !account) {
		return null;
	}

	const profileLevels = await db
		.select()
		.from(levelsEntitlements)
		.where(
			and(
				eq(levelsEntitlements.profileId, profile.id),
				eq(levelsEntitlements.enabled, true),
			),
		);

	const level = getLevelFromEntitlements(profileLevels);

	return {
		profileId: identity.profileId,
		accountId: identity.accountId,
		profile: { ...profile, level },
		account,
	};
};

export const getLevelFromEntitlements = (
	entitlements: LevelEntitlement[],
): number => {
	const filteredEntitlements = entitlements.filter(
		(entitlement) =>
			!entitlement.revoked &&
			entitlement.enabled &&
			(entitlement.expiresAt === null ||
				entitlement.expiresAt > new Date()),
	);

	const level =
		filteredEntitlements.sort((a, b) =>
			a.levelId < 3 && b.levelId >= 3
				? -1
				: a.levelId >= 3 && b.levelId < 3
					? 1
					: a.levelId < 3
						? a.levelId - b.levelId
						: b.levelId - a.levelId,
		)[0]?.levelId ?? 3;

	return level;
};
