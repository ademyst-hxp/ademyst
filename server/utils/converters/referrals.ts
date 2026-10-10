import { count, eq, inArray } from "drizzle-orm";

import type { H3Event } from "h3";

import { useDb } from "#server/db";

import {
	type Referral as DbReferral,
	type ReferralCode as DbReferralCode,
	referralCodes,
	referrals,
} from "~~/server/db/schema/referrals";

import { profiles } from "~~/server/db/schema/profiles";

import type { Referral, ReferralCode } from "~~/shared/models/referrals";

import type { Profile } from "~~/shared/models/profiles";

import {
	retrieveCleanProfile,
	retrieveSeveralCleanProfiles,
} from "~~/server/utils/converters/profiles";

function convertReferralCode(
	referralCode: DbReferralCode,
	uses: number,
	author: Profile,
): ReferralCode {
	return {
		id: referralCode.id,
		author,
		code: referralCode.code,
		uses,
		enabled: referralCode.enabled,
		createdAt: referralCode.createdAt,
		expiresAt: referralCode.expiresAt ?? null,
	};
}

export async function retrieveCleanReferralCode(
	event: H3Event,
	identity: Identity | null | undefined,
	referralCode: DbReferralCode,
): Promise<ReferralCode> {
	const db = useDb(event);

	const author = await db.query.profiles.findFirst({
		where: (profile, { eq }) => eq(profile.id, referralCode.authorId),
	});

	if (!author) {
		throw new Error("Author not found");
	}

	const [uses] = await db
		.select({
			count: count(),
		})
		.from(referrals)
		.where(eq(referrals.code, referralCode.code));

	const profile = await retrieveCleanProfile(event, identity, author);

	return convertReferralCode(referralCode, uses?.count ?? 0, profile);
}

export async function retrieveSeveralCleanReferralCodes(
	event: H3Event,
	identity: Identity | null | undefined,
	dbReferralCodes: DbReferralCode[],
): Promise<ReferralCode[]> {
	const db = useDb(event);

	if (dbReferralCodes.length === 0) {
		return [];
	}

	const authorIds = [
		...new Set(
			dbReferralCodes.map((referralCode) => referralCode.authorId),
		),
	];

	const codes = dbReferralCodes.map((referralCode) => referralCode.code);

	const dbAuthors = await db
		.select()
		.from(profiles)
		.where(inArray(profiles.id, authorIds));

	const authorsList = await retrieveSeveralCleanProfiles(
		event,
		identity,
		dbAuthors,
	);

	const authors = new Map<string, Profile>(
		authorsList.map((author) => [author.id, author]),
	);

	const usesCounts = await db
		.select({
			code: referrals.code,
			count: count(),
		})
		.from(referrals)
		.where(inArray(referrals.code, codes))
		.groupBy(referrals.code);

	const usesMap = new Map<string, number>(
		usesCounts.map((row) => [row.code, row.count ?? 0]),
	);

	return dbReferralCodes.map((referralCode) => {
		const author = authors.get(referralCode.authorId);

		if (!author) {
			throw new Error("Author not found");
		}

		return convertReferralCode(
			referralCode,
			usesMap.get(referralCode.code) ?? 0,
			author,
		);
	});
}

export async function retrieveCleanReferral(
	event: H3Event,
	identity: Identity | null | undefined,
	referral: DbReferral,
): Promise<Referral> {
	const db = useDb(event);

	const [[referralCode], [referred]] = await Promise.all([
		db
			.select()
			.from(referralCodes)
			.where(eq(referralCodes.code, referral.code))
			.limit(1),

		db
			.select()
			.from(profiles)
			.where(eq(profiles.id, referral.referredId))
			.limit(1),
	]);

	if (!referralCode) {
		throw new Error("Referral code not found");
	}

	if (!referred) {
		throw new Error("Referred profile not found");
	}

	const [cleanReferralCode, cleanReferred] = await Promise.all([
		retrieveCleanReferralCode(event, identity, referralCode),

		retrieveCleanProfile(event, identity, referred),
	]);

	return {
		id: referral.id,
		referralCode: cleanReferralCode,
		referred: cleanReferred,
		confirmed: referral.confirmed,
		createdAt: referral.createdAt,
		confirmedAt: referral.confirmedAt ?? null,
	};
}

export async function retrieveSeveralCleanReferrals(
	event: H3Event,
	identity: Identity | null | undefined,
	dbReferrals: DbReferral[],
): Promise<Referral[]> {
	const db = useDb(event);

	if (dbReferrals.length === 0) {
		return [];
	}

	const referralCodeValues = [
		...new Set(dbReferrals.map((referral) => referral.code)),
	];

	const referredIds = [
		...new Set(dbReferrals.map((referral) => referral.referredId)),
	];

	const [dbReferralCodes, dbReferredProfiles] = await Promise.all([
		db
			.select()
			.from(referralCodes)
			.where(inArray(referralCodes.code, referralCodeValues)),

		db.select().from(profiles).where(inArray(profiles.id, referredIds)),
	]);

	const [referralCodesList, referredList] = await Promise.all([
		retrieveSeveralCleanReferralCodes(event, identity, dbReferralCodes),

		retrieveSeveralCleanProfiles(event, identity, dbReferredProfiles),
	]);

	const referralCodesMap = new Map(
		referralCodesList.map((referralCode) => [
			referralCode.code,
			referralCode,
		]),
	);

	const referredMap = new Map(
		referredList.map((profile) => [profile.id, profile]),
	);

	return dbReferrals.map((referral) => {
		const referralCode = referralCodesMap.get(referral.code);

		if (!referralCode) {
			throw new Error("Referral code not found");
		}

		const referred = referredMap.get(referral.referredId);

		if (!referred) {
			throw new Error("Referred profile not found");
		}

		return {
			id: referral.id,
			referralCode,
			referred,
			confirmed: referral.confirmed,
			createdAt: referral.createdAt,
			confirmedAt: referral.confirmedAt ?? null,
		};
	});
}
