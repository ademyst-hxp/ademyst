import type MarkdownIt from "markdown-it";

declare module "#app" {
	interface NuxtApp {
		$md: MarkdownIt;
	}
}

declare module "vue" {
	interface ComponentCustomProperties {
		$md: MarkdownIt;
	}
}

export {};
