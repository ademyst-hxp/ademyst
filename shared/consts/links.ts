export const domains: Record<
	string,
	{
		name: string;
		title: string;
		icon: string;
		slugType: "name" | "id";
		pattern: RegExp;
	}
> = {
	"youtube.com": {
		name: "youtube",
		title: "YouTube",
		icon: "https://cdn.simpleicons.org/youtube",
		slugType: "name",
		pattern: /^\/(?:@|user\/|channel\/|c\/)([A-Za-z0-9._-]+)\/?$/i,
	},

	"twitter.com": {
		name: "x",
		title: "X",
		icon: "https://cdn.simpleicons.org/x",
		slugType: "name",
		pattern: /^\/([A-Za-z0-9_]+)\/?$/i,
	},

	"x.com": {
		name: "x",
		title: "X",
		icon: "https://cdn.simpleicons.org/x",
		slugType: "name",
		pattern: /^\/([A-Za-z0-9_]+)\/?$/i,
	},

	"bsky.app": {
		name: "bsky",
		title: "Bluesky",
		icon: "https://cdn.simpleicons.org/bluesky",
		slugType: "name",
		pattern: /^\/profile\/([A-Za-z0-9_.-]+)\/?$/i,
	},

	"beam.ejnalo.me": {
		name: "beam",
		title: "Beam",
		icon: "https://beam.ejnalo.me/favicon.ico",
		slugType: "name",
		pattern: /^\/@([A-Za-z0-9_.-]+)\/?$/i,
	},

	"instagram.com": {
		name: "instagram",
		title: "Instagram",
		icon: "https://cdn.simpleicons.org/instagram",
		slugType: "name",
		pattern: /^\/([A-Za-z0-9._]+)\/?$/i,
	},

	"facebook.com": {
		name: "facebook",
		title: "Facebook",
		icon: "https://cdn.simpleicons.org/facebook",
		slugType: "name",
		pattern: /^\/([A-Za-z0-9._-]+)\/?$/i,
	},

	"github.com": {
		name: "github",
		title: "GitHub",
		icon: "https://cdn.simpleicons.org/github",
		slugType: "name",
		pattern: /^\/([A-Za-z0-9-]+)\/?$/i,
	},

	"twitch.tv": {
		name: "twitch",
		title: "Twitch",
		icon: "https://cdn.simpleicons.org/twitch",
		slugType: "name",
		pattern: /^\/([A-Za-z0-9_]+)\/?$/i,
	},

	"discord.com": {
		name: "discord",
		title: "Discord",
		icon: "https://cdn.simpleicons.org/discord",
		slugType: "id",
		pattern: /^\/users\/([A-Za-z0-9_-]+)\/?$/i,
	},

	"reddit.com": {
		name: "reddit",
		title: "Reddit",
		icon: "https://cdn.simpleicons.org/reddit",
		slugType: "name",
		pattern: /^\/(?:user|u)\/([A-Za-z0-9_-]+)\/?$/i,
	},

	"soundcloud.com": {
		name: "soundcloud",
		title: "SoundCloud",
		icon: "https://cdn.simpleicons.org/soundcloud",
		slugType: "name",
		pattern: /^\/([A-Za-z0-9_-]+)\/?$/i,
	},

	"spotify.com": {
		name: "spotify",
		title: "Spotify",
		icon: "https://cdn.simpleicons.org/spotify",
		slugType: "id",
		pattern: /^\/user\/([A-Za-z0-9_-]+)\/?$/i,
	},

	"tiktok.com": {
		name: "tiktok",
		title: "TikTok",
		icon: "https://cdn.simpleicons.org/tiktok",
		slugType: "name",
		pattern: /^\/@([A-Za-z0-9._]+)\/?$/i,
	},
} as const;
