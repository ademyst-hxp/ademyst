import { eq } from "drizzle-orm";

import { useDb } from "../db";
import type { H3Event } from "h3";

import { profiles, Profile } from "../db/schema/profiles";
import { accounts, Account, sessions } from "../db/schema/accounts";

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

export const getUser = async (event: H3Event, identity: Identity): Promise<UserIdentity | null> => {
	const db = useDb(event);

	const [profile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, identity.profileId))
		.limit(1);

	if (!profile) {
		return null;
	}

	const [account] = await db
		.select()
		.from(accounts)
		.where(eq(accounts.id, identity.accountId))
		.limit(1);

	if (!account) {
		return null;
	}

	return {
		profileId: identity.profileId,
		accountId: identity.accountId,
		profile,
		account,
	};
};
