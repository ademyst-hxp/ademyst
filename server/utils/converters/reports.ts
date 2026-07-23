import type {
	ProfileReport as DbProfileReport,
	PostReport as DbPostReport,
	StatusReport as DbStatusReport,
} from "~~/server/db/schema/reports";
import type {
	ProfileReport,
	PostReport,
	StatusReport,
} from "~~/shared/models/reports";
import type { Account } from "~~/shared/models/accounts";
import type { Profile } from "~~/shared/models/profiles";

export function convertProfileReport(
	report: DbProfileReport,
	reporter: Account,
	reportedProfile: Profile,
): ProfileReport {
	return {
		id: report.id,
		reporter,
		reportedProfile,
		reason: report.reason,
		details: report.details ?? null,
		status: report.status,
		createdAt: report.createdAt,
	};
}

export function convertPostReport(
	report: DbPostReport,
	reporter: Account,
	reportedPost: Profile,
): PostReport {
	return {
		id: report.id,
		reporter,
		reportedPost,
		reason: report.reason,
		details: report.details ?? null,
		status: report.status,
		createdAt: report.createdAt,
	};
}

export function convertStatusReport(
	report: DbStatusReport,
	reporter: Account,
	reportedStatus: Profile,
): StatusReport {
	return {
		id: report.id,
		reporter,
		reportedStatus,
		reason: report.reason,
		details: report.details ?? null,
		status: report.status,
		createdAt: report.createdAt,
	};
}
