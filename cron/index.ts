import postgres from "postgres";

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

function schedulesFor(cron: string): Schedule[] {
	if (cron === CRON_HOURLY) return ["hourly"];
	if (cron === CRON_DAILY) return ["daily"];

	// Déclenchement manuel (wrangler dev --test-scheduled) : tout est exécuté
	return ["hourly", "daily"];
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

		try {
			const results = await runRetention({
				query,
				schedules,
				dryRun,
				log: (entry) => console.log(JSON.stringify({ event: "step", ...entry })),
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

			// Fait apparaître l'exécution comme échouée dans le dashboard Cloudflare
			if (errors.length) {
				throw new Error(
					`Retention failed: ${errors.map((e) => `${e.job} (${e.reason})`).join("; ")}`,
				);
			}
		} finally {
			await sql.end({ timeout: 5 }).catch(() => {});
		}
	},
} satisfies ExportedHandler<CronEnv>;
