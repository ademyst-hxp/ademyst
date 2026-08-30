import { eq } from "drizzle-orm";

import { createDb } from "../db";
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
	const { db, client } = createDb();

	const authorization = getHeader(event, "Authorization");
	const accessTokenCookie = getCookie(event, "accessToken");

	const token = getBearerToken(authorization) ?? accessTokenCookie ?? null;

	if (!token) {
		await client.end();
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
			await client.end();
			return null;
		}

		return {
			profileId: payload.profileId,
			accountId: payload.sub ?? "",
		};
	} catch {
		await client.end();
		return null;
	} finally {
		await client.end();
	}
};

export const getUser = async (
	event: H3Event,
	identity: Identity,
): Promise<UserIdentity | null> => {
	const { db, client } = createDb();

	try {
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
			await client.end();
			return null;
		}

		return {
			profileId: identity.profileId,
			accountId: identity.accountId,
			profile,
			account,
		};
	} finally {
		await client.end();
	}
};
