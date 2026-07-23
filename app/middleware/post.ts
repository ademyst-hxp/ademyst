import type { Post } from "~~/shared/models/interactions";

type PostsResponse = {
	posts?: Array<Post | Promise<Post>>;
};

export default defineNuxtRouteMiddleware(async (to) => {
	const headerPost = useHeaderPostContent();

	const rawName = to.params.name;
	const name = Array.isArray(rawName) ? rawName[0] : rawName;

	if (!name) {
		headerPost.value = null;
		return;
	}

	const rawPostId = to.params.postId ?? to.params.id;
	const postId = Array.isArray(rawPostId) ? rawPostId[0] : rawPostId;

	try {
		const response = await $fetch<PostsResponse>(
			`/api/v1/users/${encodeURIComponent(name)}/posts`,
			{
				query: {
					limit: 25,
					offset: 0,
				},
			},
		);

		const posts = await Promise.all(
			(response.posts ?? []).map((post) => Promise.resolve(post)),
		);

		const selectedPost =
			(postId ? posts.find((post) => post.id === postId) : undefined) ??
			posts[0];

		headerPost.value = selectedPost
			? {
					id: selectedPost.id,
					content: selectedPost.content,
				}
			: null;
	} catch {
		headerPost.value = null;
	}
});
