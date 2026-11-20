import postgres from "postgres";

import { runChristmas } from "./christmas.ts";
import { runRetention, type Query, type Schedule } from "./retention.ts";

interface CronEnv {
	/** Chaîne de connexion Supabase (pooler "transaction", port 6543) */
	DATABASE_URL?: string;

	/** Tout sauf la valeur exacte "false" = dry-run (ne supprime rien) */
	DRY_RUN?: string;
}

// Doivent correspondre EXACTEMENT à [triggers].crons dans wrangler.toml
const CRON_HOURLY = "0 * * * *";
const CRON_DAILY = "15 3 * * *";
// 24/12 à 23:59 UTC : fin de la journée du 24 (les quêtes se valident sur
// des jours UTC), juste avant le 25. Tourne chaque année : christmas.ts
// refuse de distribuer en dehors de la période de la campagne.
const CRON_CHRISTMAS = "59 23 24 12 *";

type Task = Schedule | "christmas";

function schedulesFor(cron: string): Task[] {
	if (cron === CRON_HOURLY) return ["hourly"];
	if (cron === CRON_DAILY) return ["daily"];
	if (cron === CRON_CHRISTMAS) return ["christmas"];

	// Déclenchement manuel (wrangler dev --test-scheduled) : tout est exécuté
	return ["hourly", "daily", "christmas"];
}

export default {
	async scheduled(
		controller: ScheduledController,
		env: CronEnv,
		_ctx: ExecutionContext,
	): Promise<void> {
		if (!env.DATABASE_URL) {
			throw new Error("DATABASE_URL is not defined");
		}

		const dryRun = env.DRY_RUN !== "false";
		const schedules = schedulesFor(controller.cron);

		console.log(
			JSON.stringify({ event: "start", cron: controller.cron, schedules, dryRun }),
		);

		const sql = postgres(env.DATABASE_URL, {
			prepare: false,
			fetch_types: false,
			max: 1,
			idle_timeout: 20,
			connect_timeout: 10,
		});

		const query: Query = async (text, params) =>
			(await sql.unsafe(text, params as never[])) as unknown as Record<
				string,
				unknown
			>[];

		// Chaque tâche est isolée : l'échec de l'une n'empêche pas l'autre.
		const failures: string[] = [];

		try {
			const retentionSchedules = schedules.filter(
				(s): s is Schedule => s !== "christmas",
			);

			if (retentionSchedules.length) {
				const results = await runRetention({
					query,
					schedules: retentionSchedules,
					dryRun,
					log: (entry) =>
						console.log(JSON.stringify({ event: "step", ...entry })),
				});

				const errors = results.filter((r) => r.status === "error");

				console.log(
					JSON.stringify({
						event: "done",
						dryRun,
						rows: results.reduce((sum, r) => sum + r.rows, 0),
						errors: errors.length,
					}),
				);

				if (errors.length) {
					failures.push(
						`Retention failed: ${errors.map((e) => `${e.job} (${e.reason})`).join("; ")}`,
					);
				}
			}

			if (schedules.includes("christmas")) {
				try {
					await runChristmas({
						query,
						dryRun,
						scheduledTime: controller.scheduledTime,
						log: (entry) =>
							console.log(JSON.stringify({ event: "step", ...entry })),
					});
				} catch (error) {
					failures.push(
						`Christmas failed: ${error instanceof Error ? error.message : String(error)}`,
					);
				}
			}

			// Fait apparaître l'exécution comme échouée dans le dashboard Cloudflare
			if (failures.length) {
				throw new Error(failures.join(" | "));
			}
		} finally {
			await sql.end({ timeout: 5 }).catch(() => {});
		}
	},
} satisfies ExportedHandler<CronEnv>;
