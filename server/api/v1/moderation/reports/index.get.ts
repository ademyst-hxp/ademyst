export default defineEventHandler(async (event) => {
	return {
		posts: "/api/v1/moderation/reports/posts",
		profiles: "/api/v1/moderation/reports/profiles",
		whispers: "/api/v1/moderation/reports/whispers",
		"[id]": {
			review: "/api/v1/moderation/reports/[id]/review",
		},
	};
});
