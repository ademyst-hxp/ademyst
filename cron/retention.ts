/*
 * Règles de rétention (purge automatique des données périmées).
 *
 * Ce fichier ne dépend de rien : il décrit les règles, fabrique le SQL et
 * l'exécute via la fonction `query` qu'on lui injecte (voir index.ts).
 *
 * Toutes les comparaisons de dates sont faites par PostgreSQL
 * (`now() - interval`), jamais côté JavaScript, pour éviter tout décalage
 * de fuseau horaire avec les colonnes `timestamp` (sans fuseau).
 */

export type Query = (
	text: string,
	params: unknown[],
) => Promise<Record<string, unknown>[]>;

export type Schedule = "hourly" | "daily";

export interface Step {
	table: string;
	where: string;
	countWhere?: string;
}

export interface Job {
	name: string;
	schedule: Schedule;
	retention: string;
	steps: Step[];
	requires?: { table: string; columns: string[] };
}

const IDENT = /^[a-z][a-z0-9_]*$/;

function ident(name: string): string {
	if (!IDENT.test(name)) {
		throw new Error(`Identifiant SQL invalide : ${name}`);
	}

	return `"${name}"`;
}

function simple(
	table: string,
	column: string,
	retention: string,
	schedule: Schedule,
	requires?: Job["requires"],
): Job {
	return {
		name: table,
		schedule,
		retention,
		steps: [{ table, where: `${ident(column)} < now() - $1::interval` }],
		requires,
	};
}

/*
 * L'ordre du tableau est l'ordre d'exécution à l'intérieur d'un même schedule.
 *
 * Les tables notification_* sont listées une par une : un wildcard attraperait
 * aussi `notification_settings` (réglages des utilisateurs, à ne jamais purger).
 */
export const JOBS: Job[] = [
	// --- Toutes les heures : données éphémères (24 h) ---
	simple("whisper_reactions", "created_at", "24 hours", "hourly"),
	simple("whispers", "created_at", "24 hours", "hourly"),

	// --- Tous les jours ---
	simple("account_deletion_tokens", "created_at", "1 year", "daily"),

	// Le brief parle de "account_modification_tokens", qui n'existe pas :
	// c'est l'historique des modifications de compte.
	simple("account_modification_history", "created_at", "1 year", "daily"),

	simple("data_exports", "created_at", "3 years", "daily"),
	simple("email_change_tokens", "created_at", "1 year", "daily"),
	simple("email_confirmation_tokens", "created_at", "1 year", "daily"),

	simple("notification_post", "created_at", "1 year", "daily"),
	simple("notification_whisper", "created_at", "1 year", "daily"),
	simple("notification_follow", "created_at", "1 year", "daily"),
	simple("notification_sanction", "created_at", "1 year", "daily"),
	simple("notification_post_sanction", "created_at", "1 year", "daily"),
	simple("notification_report", "created_at", "1 year", "daily"),

	simple("password_reset_tokens", "updated_at", "1 year", "daily"),

	simple("post_reports", "updated_at", "5 years", "daily"),
	simple("profile_reports", "updated_at", "5 years", "daily"),


	simple("requests", "created_at", "1 year", "daily"),

	// expires_at NULL (sanction sans expiration) : jamais supprimée.
	simple("sanctions", "expires_at", "5 years", "daily"),

	simple("sessions", "updated_at", "1 year", "daily"),
	simple("whisper_reports", "updated_at", "5 years", "daily"),
];

export function countSql(step: Step): string {
	return `SELECT count(*)::int AS n FROM public.${ident(step.table)} WHERE ${step.countWhere ?? step.where}`;
}

// $1 = intervalle, $2 = taille du lot
export function deleteBatchSql(step: Step): string {
	const table = `public.${ident(step.table)}`;

	return (
		`WITH d AS (DELETE FROM ${table} WHERE id IN ` +
		`(SELECT id FROM ${table} WHERE ${step.where} LIMIT $2) RETURNING 1) ` +
		`SELECT count(*)::int AS n FROM d`
	);
}

export const REQUIRES_SQL =
	`SELECT count(*)::int AS n FROM information_schema.columns ` +
	`WHERE table_schema = 'public' AND table_name = $1 AND column_name = ANY($2::text[])`;

export interface RunOptions {
	query: Query;
	schedules: Schedule[];

	/** true : ne supprime rien, compte seulement les lignes concernées. */
	dryRun: boolean;

	batchSize?: number;
	maxBatchesPerStep?: number;
	log?: (entry: Record<string, unknown>) => void;
}

export interface StepResult {
	job: string;
	table: string;
	status: "deleted" | "counted" | "skipped" | "error";
	rows: number;
	truncated?: boolean;
	reason?: string;
}

export async function runRetention(options: RunOptions): Promise<StepResult[]> {
	const {
		query,
		schedules,
		dryRun,
		batchSize = 5000,
		maxBatchesPerStep = 40,
		log = () => {},
	} = options;

	const results: StepResult[] = [];

	const push = (result: StepResult) => {
		results.push(result);
		log({ ...result, dryRun });
	};

	for (const job of JOBS) {
		if (!schedules.includes(job.schedule)) continue;

		try {
			if (job.requires) {
				const [row] = await query(REQUIRES_SQL, [
					job.requires.table,
					`{${job.requires.columns.join(",")}}`,
				]);

				if (Number(row?.n ?? 0) < job.requires.columns.length) {
					push({
						job: job.name,
						table: job.requires.table,
						status: "skipped",
						rows: 0,
						reason: "table ou colonne absente",
					});
					continue;
				}
			}

			for (const step of job.steps) {
				if (dryRun) {
					const [row] = await query(countSql(step), [job.retention]);

					push({
						job: job.name,
						table: step.table,
						status: "counted",
						rows: Number(row?.n ?? 0),
					});
					continue;
				}

				let total = 0;
				let truncated = false;

				for (let batch = 1; ; batch++) {
					const [row] = await query(deleteBatchSql(step), [
						job.retention,
						batchSize,
					]);
					const deleted = Number(row?.n ?? 0);

					total += deleted;

					if (deleted < batchSize) break;

					if (batch >= maxBatchesPerStep) {
						truncated = true;
						break;
					}
				}

				push({
					job: job.name,
					table: step.table,
					status: "deleted",
					rows: total,
					truncated: truncated || undefined,
				});
			}
		} catch (error) {
			push({
				job: job.name,
				table: job.name,
				status: "error",
				rows: 0,
				reason: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return results;
}
