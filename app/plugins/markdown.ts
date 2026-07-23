import MarkdownIt from "markdown-it";
import hljs from "highlight.js/lib/common";

export default defineNuxtPlugin(() => {
	const md = new MarkdownIt({
		html: false,
		linkify: true,
		breaks: true,

		highlight(code: string, lang: string): string {
			const language = lang?.toLowerCase?.();

			if (language && hljs.getLanguage(language)) {
				const result = hljs.highlight(code, { language }).value;

				return `<pre class="hljs"><code>${result}</code></pre>`;
			}

			return `<pre class="hljs"><code>${md.utils.escapeHtml(code)}</code></pre>`;
		},
	});

	return {
		provide: {
			md,
		},
	};
});
