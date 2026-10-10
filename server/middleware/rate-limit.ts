import { RateLimiterMemory } from "rate-limiter-flexible";

const limiters = {
	// Lecture (feed, profil, recherche...)
	read: new RateLimiterMemory({
		points: 300,
		duration: 60,
	}),

	// Publier un post
	post: new RateLimiterMemory({
		points: 10,
		duration: 60,
	}),

	// Likes
	interact: new RateLimiterMemory({
		points: 30,
		duration: 60,
	}),

	// Follow / Unfollow
	user_interact: new RateLimiterMemory({
		points: 30,
		duration: 60,
	}),

	// Login
	login: new RateLimiterMemory({
		points: 5,
		duration: 15 * 60,
	}),

	// Fallback
	default: new RateLimiterMemory({
		points: 100,
		duration: 60,
	}),
};

export default defineEventHandler(async (event) => {
	const ip = getRequestIP(event) ?? "unknown";
	const path = event.path;
	const method = event.method;

	let limiter = limiters.default;

	if (method === "GET") {
		limiter = limiters.read;
	} else if (path.startsWith("/api/v1/auth/login")) {
		limiter = limiters.login;
	} else if (path.startsWith("/api/v1/posts/new")) {
		limiter = limiters.post;
	} else if (path.startsWith("/api/v1/posts")) {
		limiter = limiters.interact;
	} else if (path.startsWith("/api/v1/users")) {
		limiter = limiters.user_interact;
	} else {
		limiter = limiters.default;
	}

	try {
		await limiter.consume(ip);
	} catch {
		throw createError({
			statusCode: 429,
			statusMessage: "Too Many Requests",
		});
	}
});
