import hljs from "highlight.js/lib/common";
import MarkdownIt from "markdown-it";

type CoreRule = Parameters<MarkdownIt["core"]["ruler"]["push"]>[1];
type StateCore = Parameters<CoreRule>[0];
type Token = StateCore["tokens"][number];

const MENTION = /(^|[^\w@/.])@(\w+(?:[.-]\w+)*)/g;

function splitMentions(token: Token, state: StateCore): Token[] {
	const text = token.content;
	const result: Token[] = [];
	let last = 0;

	const pushText = (content: string, level: number) => {
		const node = new state.Token("text", "", 0);
		node.content = content;
		node.level = level;
		result.push(node);
	};

	for (const match of text.matchAll(MENTION)) {
		const prefix = match[1] ?? "";
		const username = match[2]!;
		const start = match.index! + prefix.length; // position du "@"

		if (start > last) pushText(text.slice(last, start), token.level);

		const open = new state.Token("link_open", "a", 1);
		open.attrSet("href", `/@${username}`);
		open.attrSet("class", "mention");
		open.level = token.level;
		result.push(open);

		pushText(`@${username}`, token.level + 1);

		const close = new state.Token("link_close", "a", -1);
		close.level = token.level;
		result.push(close);

		last = start + 1 + username.length;
	}

	if (last < text.length) pushText(text.slice(last), token.level);

	return result;
}

function mentionPlugin(md: MarkdownIt) {
	// Après "linkify" : les liens auto-détectés existent déjà et sont ignorés
	md.core.ruler.after("linkify", "mention", (state) => {
		for (const block of state.tokens) {
			if (block.type !== "inline" || !block.children) continue;

			const children: Token[] = [];
			let linkDepth = 0;

			for (const token of block.children) {
				if (token.type === "link_open") linkDepth++;
				else if (token.type === "link_close") linkDepth--;

				if (
					token.type === "text" &&
					linkDepth === 0 &&
					token.content.includes("@")
				) {
					children.push(...splitMentions(token, state));
				} else {
					children.push(token);
				}
			}

			block.children = children;
		}
	});
}

function underlinePlugin(md: MarkdownIt) {
	md.inline.ruler.before("html_inline", "underline", (state, silent) => {
		const { src, pos } = state;

		if (src.charCodeAt(pos) !== 0x3c /* < */) return false;
		if (!src.startsWith("<u>", pos)) return false;

		const contentStart = pos + 3;
		const end = src.indexOf("</u>", contentStart);

		if (end === -1 || end >= state.posMax || end === contentStart) {
			return false;
		}

		if (!silent) {
			const previousMax = state.posMax;

			state.push("underline_open", "u", 1);

			state.pos = contentStart;
			state.posMax = end;
			state.md.inline.tokenize(state);

			state.posMax = previousMax;
			state.push("underline_close", "u", -1);
		}

		state.pos = end + 4;
		return true;
	});
}

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

	md.use(mentionPlugin);
	md.use(underlinePlugin);

	md.renderer.rules.image = () => "";

	return {
		provide: {
			md,
		},
	};
});
