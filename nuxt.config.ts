// https://nuxt.com/docs/api/configuration/nuxt-config

import tailwindcss from "@tailwindcss/vite";
import svgLoader from "vite-svg-loader";

export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	css: ["@/assets/css/main.css"],

	vite: {
		plugins: [tailwindcss(), svgLoader()],
	},

	devtools: {
		enabled: false,
	},
});
