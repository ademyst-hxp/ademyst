import type { H3Event } from "h3";

import { useDb } from "~~/server/db";
import { eq, or, and, inArray } from "drizzle-orm";

import type {
	ProfileReport as DbProfileReport,
	PostReport as DbPostReport,
	StatusReport as DbStatusReport,
} from "~~/server/db/schema/reports";

import { profiles } from "~~/server/db/schema/profiles";
import { accounts } from "~~/server/db/schema/accounts";
import { posts, statuses } from "~~/server/db/schema/interactions";

import type {
	ProfileReport,
	PostReport,
	StatusReport,
} from "~~/shared/models/reports";

import {
	retrieveCleanProfile,
	retrieveSeveralCleanProfiles,
} from "~~/server/utils/converters/profiles";
import {
	retrieveCleanPost,
	retrieveSeveralCleanPosts,
	retrieveCleanStatus,
	retrieveSeveralCleanStatuses,
} from "~~/server/utils/converters/interactions";

import { convertAccount } from "~~/server/utils/converters/accounts";

export async function retrieveCleanProfileReport(
	event: H3Event,
	identity: Identity | null | undefined,
	report: DbProfileReport,
): Promise<ProfileReport> {
	const db = useDb(event);

	if (!identity) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

	const [issuer] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, identity?.profileId))
		.limit(1);

	if (!issuer) {
		throw createError({
			statusCode: 404,
			statusMessage: "Issuer profile not found",
		});
	}

	if (issuer.level < 6 && report.reporterId !== identity.accountId) {
		throw createError({
			statusCode: 403,
			statusMessage: "Insufficient permissions",
		});
	}

	const [reportedProfile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, report.reportedProfileId))
		.limit(1);

	if (!reportedProfile) {
		throw createError({
			statusCode: 404,
			statusMessage: "Reported profile not found",
		});
	}

	const [reporter] = await db
		.select()
		.from(accounts)
		.where(eq(accounts.id, report.reporterId))
		.limit(1);

	if (!reporter) {
		throw createError({
			statusCode: 404,
			statusMessage: "Reporter account not found",
		});
	}

	return {
		id: report.id,
		reporter: convertAccount(reporter),
		reportedProfile: await retrieveCleanProfile(
			event,
			identity,
			reportedProfile,
		),
		reason: report.reason,
		details: report.details ?? null,
		status: report.status,
		createdAt: report.createdAt,
	};
}

export async function retrieveSeveralCleanProfileReports(
	event: H3Event,
	identity: Identity | null | undefined,
	_reports: DbProfileReport[],
): Promise<ProfileReport[]> {
	const db = useDb(event);

	if (!identity) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

	const [issuer] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, identity?.profileId))
		.limit(1);

	if (!issuer) {
		throw createError({
			statusCode: 404,
			statusMessage: "Issuer profile not found",
		});
	}

	if (issuer.level < 6) {
		throw createError({
			statusCode: 403,
			statusMessage: "Insufficient permissions",
		});
	}

	const reportedProfiles = await db
		.select()
		.from(profiles)
		.where(
			inArray(
				profiles.id,
				_reports.map((r) => r.reportedProfileId),
			),
		);

	if (!reportedProfiles) {
		throw createError({
			statusCode: 404,
			statusMessage: "Reported profile not found",
		});
	}

	const reporters = await db
		.select()
		.from(accounts)
		.where(
			inArray(
				accounts.id,
				_reports.map((r) => r.reporterId),
			),
		);

	if (!reporters) {
		throw createError({
			statusCode: 404,
			statusMessage: "Reporter account not found",
		});
	}

	const cleanReporters = reporters.map((reporter) =>
		convertAccount(reporter),
	);
	const cleanProfiles = await retrieveSeveralCleanProfiles(
		event,
		identity,
		reportedProfiles,
	);

	const profileReports: ProfileReport[] = _reports.map((report) => {
		const reportedProfile = cleanProfiles.find(
			(p) => p.id === report.reportedProfileId,
		);

		if (!reportedProfile) {
			throw createError({
				statusCode: 404,
				statusMessage: "Reported profile not found",
			});
		}

		const reporter = cleanReporters.find((a) => a.id === report.reporterId);

		if (!reporter) {
			throw createError({
				statusCode: 404,
				statusMessage: "Reporter account not found",
			});
		}

		return {
			id: report.id,
			reporter,
			reportedProfile,
			reason: report.reason,
			details: report.details ?? null,
			status: report.status,
			createdAt: report.createdAt,
		};
	});

	return Promise.all(profileReports);
}

// ============================================================

export async function retrieveCleanPostReport(
	event: H3Event,
	identity: Identity | null | undefined,
	report: DbPostReport,
): Promise<PostReport> {
	const db = useDb(event);

	if (!identity) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

	const [issuer] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, identity?.profileId))
		.limit(1);

	if (!issuer) {
		throw createError({
			statusCode: 404,
			statusMessage: "Issuer profile not found",
		});
	}

	if (issuer.level < 6 && report.reporterId !== identity.accountId) {
		throw createError({
			statusCode: 403,
			statusMessage: "Insufficient permissions",
		});
	}

	const [reportedPost] = await db
		.select()
		.from(posts)
		.where(eq(posts.id, report.reportedPostId))
		.limit(1);

	if (!reportedPost) {
		throw createError({
			statusCode: 404,
			statusMessage: "Reported post not found",
		});
	}

	const [reporter] = await db
		.select()
		.from(accounts)
		.where(eq(accounts.id, report.reporterId))
		.limit(1);

	if (!reporter) {
		throw createError({
			statusCode: 404,
			statusMessage: "Reporter account not found",
		});
	}

	return {
		id: report.id,
		reporter: convertAccount(reporter),
		reportedPost: await retrieveCleanPost(event, identity, reportedPost),
		reason: report.reason,
		details: report.details ?? null,
		status: report.status,
		createdAt: report.createdAt,
	};
}

export async function retrieveSeveralCleanPostReports(
	event: H3Event,
	identity: Identity | null | undefined,
	_reports: DbPostReport[],
): Promise<PostReport[]> {
	const db = useDb(event);

	if (!identity) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

	const [issuer] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, identity?.profileId))
		.limit(1);

	if (!issuer) {
		throw createError({
			statusCode: 404,
			statusMessage: "Issuer profile not found",
		});
	}

	if (issuer.level < 6) {
		throw createError({
			statusCode: 403,
			statusMessage: "Insufficient permissions",
		});
	}

	const reportedPosts = await db
		.select()
		.from(posts)
		.where(
			inArray(
				posts.id,
				_reports.map((r) => r.reportedPostId),
			),
		);

	if (!reportedPosts) {
		throw createError({
			statusCode: 404,
			statusMessage: "Reported post not found",
		});
	}

	const reporters = await db
		.select()
		.from(accounts)
		.where(
			inArray(
				accounts.id,
				_reports.map((r) => r.reporterId),
			),
		);

	if (!reporters) {
		throw createError({
			statusCode: 404,
			statusMessage: "Reporter account not found",
		});
	}

	const cleanReporters = reporters.map((reporter) =>
		convertAccount(reporter),
	);
	const cleanPosts = await retrieveSeveralCleanPosts(
		event,
		identity,
		reportedPosts,
	);

	const postReports: PostReport[] = _reports.map((report) => {
		const reportedPost = cleanPosts.find(
			(p) => p.id === report.reportedPostId,
		);

		if (!reportedPost) {
			throw createError({
				statusCode: 404,
				statusMessage: "Reported post not found",
			});
		}

		const reporter = cleanReporters.find((a) => a.id === report.reporterId);

		if (!reporter) {
			throw createError({
				statusCode: 404,
				statusMessage: "Reporter account not found",
			});
		}

		return {
			id: report.id,
			reporter,
			reportedPost,
			reason: report.reason,
			details: report.details ?? null,
			status: report.status,
			createdAt: report.createdAt,
		};
	});

	return Promise.all(postReports);
}

// ============================================================

export async function retrieveCleanStatusReport(
	event: H3Event,
	identity: Identity | null | undefined,
	report: DbStatusReport,
): Promise<StatusReport> {
	const db = useDb(event);

	if (!identity) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

	const [issuer] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, identity?.profileId))
		.limit(1);

	if (!issuer) {
		throw createError({
			statusCode: 404,
			statusMessage: "Issuer profile not found",
		});
	}

	if (issuer.level < 6 && report.reporterId !== identity.accountId) {
		throw createError({
			statusCode: 403,
			statusMessage: "Insufficient permissions",
		});
	}

	const [reportedStatus] = await db
		.select()
		.from(statuses)
		.where(eq(statuses.id, report.reportedStatusId))
		.limit(1);

	if (!reportedStatus) {
		throw createError({
			statusCode: 404,
			statusMessage: "Reported status not found",
		});
	}

	const [reporter] = await db
		.select()
		.from(accounts)
		.where(eq(accounts.id, report.reporterId))
		.limit(1);

	if (!reporter) {
		throw createError({
			statusCode: 404,
			statusMessage: "Reporter account not found",
		});
	}

	return {
		id: report.id,
		reporter: convertAccount(reporter),
		reportedStatus: await retrieveCleanStatus(
			event,
			identity,
			reportedStatus,
		),
		reason: report.reason,
		details: report.details ?? null,
		status: report.status,
		createdAt: report.createdAt,
	};
}

export async function retrieveSeveralCleanStatusReports(
	event: H3Event,
	identity: Identity | null | undefined,
	_reports: DbStatusReport[],
): Promise<StatusReport[]> {
	const db = useDb(event);

	if (!identity) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

	const [issuer] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, identity?.profileId))
		.limit(1);

	if (!issuer) {
		throw createError({
			statusCode: 404,
			statusMessage: "Issuer profile not found",
		});
	}

	if (issuer.level < 6) {
		throw createError({
			statusCode: 403,
			statusMessage: "Insufficient permissions",
		});
	}

	const reportedStatuses = await db
		.select()
		.from(statuses)
		.where(
			inArray(
				statuses.id,
				_reports.map((r) => r.reportedStatusId),
			),
		);

	if (!reportedStatuses) {
		throw createError({
			statusCode: 404,
			statusMessage: "Reported status not found",
		});
	}

	const reporters = await db
		.select()
		.from(accounts)
		.where(
			inArray(
				accounts.id,
				_reports.map((r) => r.reporterId),
			),
		);

	if (!reporters) {
		throw createError({
			statusCode: 404,
			statusMessage: "Reporter account not found",
		});
	}

	const cleanReporters = reporters.map((reporter) =>
		convertAccount(reporter),
	);
	const cleanStatuses = await retrieveSeveralCleanStatuses(
		event,
		identity,
		reportedStatuses,
	);

	const statusReports: StatusReport[] = _reports.map((report) => {
		const reportedStatus = cleanStatuses.find(
			(s) => s.id === report.reportedStatusId,
		);

		if (!reportedStatus) {
			throw createError({
				statusCode: 404,
				statusMessage: "Reported status not found",
			});
		}

		const reporter = cleanReporters.find((a) => a.id === report.reporterId);

		if (!reporter) {
			throw createError({
				statusCode: 404,
				statusMessage: "Reporter account not found",
			});
		}

		return {
			id: report.id,
			reporter,
			reportedStatus,
			reason: report.reason,
			details: report.details ?? null,
			status: report.status,
			createdAt: report.createdAt,
		};
	});

	return Promise.all(statusReports);
}
