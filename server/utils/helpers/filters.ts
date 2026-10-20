import { createError, getQuery } from "h3";

import type { H3Event } from "h3";

// Path in the project: server/utils/helpers/filters.ts
// Import with: import { ... } from "~~/server/utils/helpers/filters";

export const REPORT_STATUSES = ["pending", "reviewed", "rejected"] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

const invalid = (name: string) =>
	createError({
		statusCode: 400,
		statusMessage: `Invalid '${name}' filter`,
	});

/**
 * Optional enum filter (?name=value). Returns undefined when the parameter is
 * absent or empty, and answers 400 when the value is not one of `allowed`.
 */
export const queryEnum = <T extends string>(
	event: H3Event,
	name: string,
	allowed: readonly T[],
): T | undefined => {
	const raw = getQuery(event)[name];

	if (raw === undefined || raw === "") return undefined;

	if (
		typeof raw !== "string" ||
		!(allowed as readonly string[]).includes(raw)
	) {
		throw invalid(name);
	}

	return raw as T;
};

/**
 * Optional boolean filter (?name=true|false|1|0). Returns undefined when the
 * parameter is absent or empty, and answers 400 for anything else.
 */
export const queryBoolean = (
	event: H3Event,
	name: string,
): boolean | undefined => {
	const raw = getQuery(event)[name];

	if (raw === undefined || raw === "") return undefined;

	if (raw === "true" || raw === "1") return true;
	if (raw === "false" || raw === "0") return false;

	throw invalid(name);
};

/**
 * ?limit and ?offset, clamped: limit between 1 and `maxLimit`, offset >= 0.
 */
export const queryPagination = (
	event: H3Event,
	{ defaultLimit = 100, maxLimit = 100 } = {},
) => {
	const query = getQuery(event);

	const limit = Math.min(
		Math.max(Number(query.limit) || defaultLimit, 1),
		maxLimit,
	);
	const offset = Math.max(Number(query.offset) || 0, 0);

	return { limit, offset };
};
