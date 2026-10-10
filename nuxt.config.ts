// https://nuxt.com/docs/api/configuration/nuxt-config

import tailwindcss from "@tailwindcss/vite";
import svgLoader from "vite-svg-loader";

export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	css: ["@/assets/css/main.css"],

	app: {
		head: {
			link: [
				// Loaded here rather than through a CSS @import, which would
				// only start downloading once main.css has been parsed.
				{ rel: "preconnect", href: "https://fonts.googleapis.com" },
				{
					rel: "preconnect",
					href: "https://fonts.gstatic.com",
					crossorigin: "",
				},
				{
					rel: "stylesheet",
					href: "https://fonts.googleapis.com/css2?family=Sansita+Swashed:wght@300..900&family=Tiro+Bangla:ital@0;1&display=swap",
				},
				{
					rel: "preload",
					as: "font",
					type: "font/woff2",
					href: "/fonts/InstrumentSans-Variable.woff2",
					crossorigin: "",
				},
			],
		},
	},

	runtimeConfig: {
		public: {
			appUrl: process.env.APP_URL || "http://localhost:3000",
			beamVerificationDeadline: process.env.BEAM_VERIFICATION_DEADLINE || new Date().toISOString(),
		},
		private: {
			databaseUrl: process.env.DATABASE_URL || "postgresql://revoldev:devpwd.16052026@localhost:5863/revolved",
			directUrl: process.env.DIRECT_URL || "postgresql://revoldev:devpwd.16052026@localhost:5863/revolved",

			resendApiKey: process.env.RESEND_API_KEY || "",

			s3Endpoint: process.env.S3_ENDPOINT || "",
			s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || "",
			s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
			s3Region: process.env.S3_REGION || "",

			jwtSecret: process.env.JWT_SECRET || "dev-secret",
			jwtIssuer: process.env.JWT_ISSUER || "http://localhost:5000",
			jwtAudience: process.env.JWT_AUDIENCE || "http://localhost:5000",
			jwtAccessTtl: process.env.JWT_ACCESS_TTL || "15m",
			jwtRefreshTtl: process.env.JWT_REFRESH_TTL || "30d",
		}
	},

	nitro: {
		preset: "cloudflare_module"
	},

	vite: {
		plugins: [tailwindcss(), svgLoader()],
	},

	devtools: {
		enabled: false,
	},
});
