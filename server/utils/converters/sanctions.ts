import type { H3Event } from "h3";

import { useDb } from "~~/server/db";
import { eq, desc, inArray } from "drizzle-orm";
import { convertAccount } from "~~/server/utils/converters/accounts";
import type { Sanction as DbSanction } from "~~/server/db/schema/sanctions";

import type { Sanction } from "~~/shared/models/sanctions";
import type { Account } from "~~/shared/models/accounts";

import { getUser } from "~~/server/utils/auth";
import { accounts } from "~~/server/db/schema/accounts";
import {
	postReports,
	profileReports,
	whisperReports,
} from "~~/server/db/schema/reports";

export async function retrieveCleanSanction(
	event: H3Event,
	identity: Identity | null | undefined,
	sanction: DbSanction,
): Promise<Sanction> {
	const db = useDb(event);

	const {
		issuerId,
		accountId,
		profileReportId,
		postReportId,
		whisperReportId,
		...sanctionWithoutParasites
	} = sanction;

	const [issuer] = await db
		.select()
		.from(accounts)
		.where(eq(accounts.id, issuerId))
		.limit(1);

	if (!issuer) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to retrieve sanction issuer",
		});
	}

	const [account] = await db
		.select()
		.from(accounts)
		.where(eq(accounts.id, accountId))
		.limit(1);

	if (!account) {
		throw createError({
			statusCode: 500,
			statusMessage: "Failed to retrieve sanction account",
		});
	}

	const [profileReport] = profileReportId
		? await db
				.select()
				.from(profileReports)
				.where(eq(profileReports.id, profileReportId))
				.limit(1)
		: [null];

	const [postReport] = postReportId
		? await db
				.select()
				.from(postReports)
				.where(eq(postReports.id, postReportId))
				.limit(1)
		: [null];

	const [whisperReport] = whisperReportId
		? await db
				.select()
				.from(whisperReports)
				.where(eq(whisperReports.id, whisperReportId))
				.limit(1)
		: [null];

	return {
		...sanctionWithoutParasites,
		issuer: convertAccount(issuer),
		account: convertAccount(account),
		profileReport: profileReport
			? await retrieveCleanProfileReport(event, identity, profileReport)
			: null,
		postReport: postReport
			? await retrieveCleanPostReport(event, identity, postReport)
			: null,
		whisperReport: whisperReport
			? await retrieveCleanWhisperReport(event, identity, whisperReport)
			: null,
	};
}

export async function retrieveSeveralCleanSanctions(
	event: H3Event,
	identity: Identity | null | undefined,
	_sanctions: DbSanction[],
): Promise<Sanction[]> {
	const db = useDb(event);

	const issuers = await db
		.select()
		.from(accounts)
		.where(
			inArray(
				accounts.id,
				_sanctions.map((s) => s.issuerId),
			),
		);

	const _accounts = await db
		.select()
		.from(accounts)
		.where(
			inArray(
				accounts.id,
				_sanctions.map((s) => s.accountId),
			),
		);

	const _profileReports = await db
		.select()
		.from(profileReports)
		.where(
			inArray(
				profileReports.id,
				_sanctions.filter((s) => s.profileReportId).map((s) => s.profileReportId!),
			),
		);

	const _postReports = await db
		.select()
		.from(postReports)
		.where(
			inArray(
				postReports.id,
				_sanctions.filter((s) => s.postReportId).map((s) => s.postReportId!),
			),
		);

	const _whisperReports = await db
		.select()
		.from(whisperReports)
		.where(
			inArray(
				whisperReports.id,
				_sanctions.filter((s) => s.whisperReportId).map((s) => s.whisperReportId!),
			),
		);

	const reportsMap = {
		profile: await retrieveSeveralCleanProfileReports(
			event,
			identity,
			_profileReports,
		),
		post: await retrieveSeveralCleanPostReports(
			event,
			identity,
			_postReports,
		),
		whisper: await retrieveSeveralCleanWhisperReports(
			event,
			identity,
			_whisperReports,
		),
	};

	const result: Sanction[] = [];

	for (const sanction of _sanctions) {
		const issuer = issuers.find((i) => i.id === sanction.issuerId);
		const account = _accounts.find((a) => a.id === sanction.accountId);

		if (!issuer || !account) {
			throw createError({
				statusCode: 500,
				statusMessage: "Failed to retrieve sanction issuer or account",
			});
		}

		const profileReport = sanction.profileReportId
			? reportsMap.profile.find(
					(r) => r.id === sanction.profileReportId,
				) || null
			: null;

		const postReport = sanction.postReportId
			? reportsMap.post.find((r) => r.id === sanction.postReportId) ||
				null
			: null;

		const whisperReport = sanction.whisperReportId
			? reportsMap.whisper.find(
					(r) => r.id === sanction.whisperReportId,
				) || null
			: null;

		const {
			issuerId,
			accountId,
			profileReportId,
			postReportId,
			whisperReportId,
			...sanctionWithoutParasites
		} = sanction;

		result.push({
			...sanctionWithoutParasites,
			issuer: convertAccount(issuer),
			account: convertAccount(account),
			profileReport,
			postReport,
			whisperReport,
		});
	}

	return result;
}
