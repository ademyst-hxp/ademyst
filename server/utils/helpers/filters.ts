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

/**
 * Optional text filter (?name=value), trimmed. Returns undefined when the
 * parameter is absent or blank, and answers 400 when it is outside
 * [minLength, maxLength] or given several times.
 */
export const queryText = (
	event: H3Event,
	name: string,
	{ minLength = 1, maxLength = 255 } = {},
): string | undefined => {
	const raw = getQuery(event)[name];

	if (raw === undefined) return undefined;
	if (typeof raw !== "string") throw invalid(name);

	const value = raw.trim();

	if (value === "") return undefined;
	if (value.length < minLength || value.length > maxLength) {
		throw invalid(name);
	}

	return value;
};

/**
 * Optional non-negative integer filter (?name=3). Returns undefined when the
 * parameter is absent or empty, and answers 400 outside [min, max].
 */
export const queryInteger = (
	event: H3Event,
	name: string,
	{ min = 0, max = 1000 } = {},
): number | undefined => {
	const raw = getQuery(event)[name];

	if (raw === undefined || raw === "") return undefined;
	if (typeof raw !== "string" || !/^\d{1,9}$/.test(raw)) throw invalid(name);

	const value = Number(raw);

	if (value < min || value > max) throw invalid(name);

	return value;
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/**
 * Optional date filter (?name=YYYY-MM-DD or ?name=<ISO 8601>). A bare date
 * covers the whole UTC day: `boundary` picks its first ("start") or last
 * ("end") millisecond. A full timestamp is used as is. Answers 400 for
 * anything that is not a real date.
 */
export const queryDate = (
	event: H3Event,
	name: string,
	boundary: "start" | "end",
): Date | undefined => {
	const raw = getQuery(event)[name];

	if (raw === undefined || raw === "") return undefined;
	if (typeof raw !== "string") throw invalid(name);

	let date: Date;

	if (DATE_ONLY.test(raw)) {
		date = new Date(
			`${raw}T${boundary === "start" ? "00:00:00.000" : "23:59:59.999"}Z`,
		);

		// "2026-02-31" is rolled over by some engines: compare the day back.
		if (
			Number.isNaN(date.getTime()) ||
			date.toISOString().slice(0, 10) !== raw
		) {
			throw invalid(name);
		}
	} else if (DATE_TIME.test(raw)) {
		date = new Date(raw);
	} else {
		throw invalid(name);
	}

	if (Number.isNaN(date.getTime())) throw invalid(name);

	return date;
};

/**
 * Optional list filter (?name=a,b or ?name=a&name=b), deduplicated. Returns
 * undefined when the parameter is absent or empty, and answers 400 when a
 * value is not one of `allowed`.
 */
export const queryEnumList = <T extends string>(
	event: H3Event,
	name: string,
	allowed: readonly T[],
): T[] | undefined => {
	const raw = getQuery(event)[name];

	if (raw === undefined || raw === "") return undefined;

	const values = (Array.isArray(raw) ? raw : [raw])
		.flatMap((entry) => (typeof entry === "string" ? entry.split(",") : [null]))
		.map((entry) => (entry === null ? null : entry.trim()))
		.filter((entry) => entry !== "");

	if (values.length === 0) return undefined;

	for (const value of values) {
		if (value === null || !(allowed as readonly string[]).includes(value)) {
			throw invalid(name);
		}
	}

	return [...new Set(values as T[])];
};
